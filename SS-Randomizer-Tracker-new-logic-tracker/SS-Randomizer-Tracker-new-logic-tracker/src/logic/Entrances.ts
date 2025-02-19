import { invert } from 'es-toolkit';
import type { TypedOptions } from '../permalink/SettingsTypes';
import type { TrackerState } from '../tracker/Slice';
import { mapValues } from '../utils/Collections';
import { compareBy } from '../utils/Compare';
import { appError } from '../utils/Debug';
import type { DungeonName, ExitMapping } from './Locations';
import type {
    LinkedEntrancePool,
    Logic,
    TrackerLinkedEntrancePool,
} from './Logic';
import {
    bannedExitsAndEntrances,
    lmfSecondExit,
    nonRandomizedEntrances,
    nonRandomizedExits,
} from './ThingsThatWouldBeNiceToHaveInTheDump';

export interface Entrance {
    name: string;
    id: string;
}

export interface EntrancePool {
    entrances: Entrance[];
    usedEntrancesExcluded: boolean;
}

export type ExitRule =
    | {
          /** This exit has its vanilla connection. */
          type: 'vanilla';
      }
    | {
          /** This exit always leads to the same entrance as `otherExit`. Currently used for Sandship. */
          type: 'follow';
          otherExit: string;
      }
    | {
          /** This is LMF's second exit. It leads to its vanilla exit iff the LMF entrance is vanilla. */
          type: 'lmfSecondExit';
      }
    | {
          /** This is a linked exit, e.g. interior dungeon exit when exterior exit into dungeon has been mapped. */
          type: 'linked';
          pool: LinkedEntrancePool;
          /** The identifier of this pool entry ("Skyview", "Faron Silent Realm", ...) */
          entry: string;
      }
    | {
          /** This entrance is random in some way. */
          type: 'random';
          pool: string;
          isKnownIrrelevant?: boolean;
      };

const fullErPool = 'TR_FULL_ER';
const startingEntrancePool = 'TR_STARTING_ENTRANCE';

export function getAllowedStartingEntrances(
    logic: Logic,
    randomizeStart: TypedOptions['random-start-entrance'],
): Entrance[] {
    return Object.entries(logic.areaGraph.entrances)
        .filter(([id, def]) => {
            if (def['can-start-at'] === false) {
                return false;
            }

            // Vanilla starting entrance is always valid for all settings
            if (id === logic.areaGraph.vanillaConnections['\\Start']) {
                return true;
            }

            switch (randomizeStart) {
                case 'Vanilla':
                    return false;
                case 'Bird Statues':
                    return def.subtype === 'bird-statue-entrance';
                case 'Any Surface Region':
                    return def.province !== 'The Sky';
                case 'Any':
                    return true;
                default:
                    return true;
            }
        })
        .map(([id, def]) => ({
            id,
            name: def.short_name,
        }));
}

export function getEntrancePools(
    areaGraph: Logic['areaGraph'],
    allowedStartingEntrances: Entrance[],
    randomEntranceSetting: TypedOptions['randomize-entrances'],
    randomDungeonEntranceSetting: TypedOptions['randomize-dungeon-entrances'],
    requiredDungeons: DungeonName[],
) {
    const relevantDerSetting =
        randomDungeonEntranceSetting ?? randomEntranceSetting;
    const requiredDungeonsSeparately =
        relevantDerSetting === 'Required Dungeons Separately';
    const skyKeepVanilla =
        relevantDerSetting !== 'All Surface Dungeons + Sky Keep' &&
        relevantDerSetting !== 'Required Dungeons Separately';
    const requiredDungeons_: string[] = requiredDungeons;

    const result: Record<string, EntrancePool> = {};
    for (const [pool, entries] of Object.entries(
        areaGraph.linkedEntrancePools,
    )) {
        result[pool] = {
            usedEntrancesExcluded: true,
            entrances: [],
        };

        if (pool === 'dungeons' && requiredDungeonsSeparately) {
            result['dungeons_unrequired'] = {
                usedEntrancesExcluded: true,
                entrances: [],
            };
        }

        for (const [entry, linkage] of Object.entries(entries)) {
            if (skyKeepVanilla && entry === 'Sky Keep') {
                continue;
            }
            const entranceId = linkage.entrances[0];

            const val = {
                id: entranceId,
                name: areaGraph.entrances[entranceId].short_name,
            };

            if (
                requiredDungeonsSeparately &&
                pool === 'dungeons' &&
                !requiredDungeons_.includes(entry)
            ) {
                result['dungeons_unrequired'].entrances.push(val);
            } else {
                result[pool].entrances.push(val);
            }
        }
    }

    result[startingEntrancePool] = {
        usedEntrancesExcluded: false,
        entrances: allowedStartingEntrances,
    };

    for (const [pool, exitAndEntrances] of Object.entries(
        areaGraph.birdStatueSanity,
    )) {
        result[pool] = {
            usedEntrancesExcluded: false,
            entrances: Object.values(exitAndEntrances.entrances).map(
                (entranceId) => {
                    return {
                        id: entranceId,
                        name: areaGraph.entrances[entranceId].short_name,
                    };
                },
            ),
        };
    }

    result[fullErPool] = {
        usedEntrancesExcluded: false,
        entrances: Object.entries(areaGraph.entrances)
            .filter(
                ([entranceId]) =>
                    !bannedExitsAndEntrances.includes(entranceId) &&
                    areaGraph.entrances[entranceId].stage !== undefined &&
                    !nonRandomizedEntrances.includes(entranceId),
            )
            .map(([id, def]) => ({
                id,
                name: def.short_name,
            })),
    };

    return result;
}

export function getExitRules(
    logic: Logic,
    startingEntranceSetting: TypedOptions['random-start-entrance'],
    randomEntranceSetting: TypedOptions['randomize-entrances'],
    randomDungeonEntranceSetting: TypedOptions['randomize-dungeon-entrances'],
    randomTrialsSetting: TypedOptions['randomize-trials'],
    statueSanity: TypedOptions['random-start-statues'],
    eud: TypedOptions['empty-unrequired-dungeons'],
    requiredDungeons: DungeonName[],
) {
    const result: Record<string, ExitRule> = {};

    const followToCanonicalEntrance = invert<string, string>(
        logic.areaGraph.autoExits,
    );

    const everythingRandomized = randomEntranceSetting === 'All';
    const relevantDerSetting =
        randomDungeonEntranceSetting ?? randomEntranceSetting;
    const dungeonEntrancesRandomized = relevantDerSetting !== 'None';
    const requiredDungeonsSeparately =
        relevantDerSetting === 'Required Dungeons Separately';
    const skyKeepVanilla =
        relevantDerSetting !== 'All Surface Dungeons + Sky Keep' &&
        relevantDerSetting !== 'Required Dungeons Separately';

    for (const exitId of Object.keys(logic.areaGraph.exits)) {
        if (
            bannedExitsAndEntrances.includes(
                exitId,
            ) /*|| exitId.includes('Statue Dive')*/
        ) {
            continue;
        }

        if (nonRandomizedExits.includes(exitId)) {
            result[exitId] = { type: 'vanilla' };
            continue;
        }

        if (exitId === '\\Start') {
            if (startingEntranceSetting !== 'Vanilla') {
                result[exitId] = {
                    type: 'random',
                    pool: startingEntrancePool,
                };
            } else {
                result[exitId] = { type: 'vanilla' };
            }
            continue;
        }

        if (followToCanonicalEntrance[exitId]) {
            result[exitId] = {
                type: 'follow',
                otherExit: followToCanonicalEntrance[exitId],
            };
            continue;
        }

        if (exitId === lmfSecondExit) {
            result[exitId] = {
                type: 'lmfSecondExit',
            };
            continue;
        }

        const birdStatueSanityPool = Object.entries(
            logic.areaGraph.birdStatueSanity,
        ).find(([, entry]) => entry.exit === exitId);
        if (birdStatueSanityPool && statueSanity) {
            result[exitId] = {
                type: 'random',
                pool: birdStatueSanityPool[0],
            };
            continue;
        }

        const poolData = (() => {
            for (const [pool_, entries] of Object.entries(
                logic.areaGraph.linkedEntrancePools,
            )) {
                const pool =
                    pool_ as keyof typeof logic.areaGraph.linkedEntrancePools;
                for (const [entry, linkage] of Object.entries(entries)) {
                    if (linkage.exits[0] === exitId) {
                        return [pool, entry, true] as const;
                    } else if (linkage.exits[1] === exitId) {
                        return [pool, entry, false] as const;
                    }
                }
            }
        })();

        if (poolData) {
            const [pool, entry, isOutsideExit] = poolData;
            if (
                (pool === 'dungeons' &&
                    dungeonEntrancesRandomized &&
                    (entry !== 'Sky Keep' || !skyKeepVanilla)) ||
                (pool === 'silent_realms' && randomTrialsSetting)
            ) {
                if (isOutsideExit) {
                    const requiredDungeons_: string[] = requiredDungeons;
                    if (
                        pool === 'dungeons' &&
                        requiredDungeonsSeparately &&
                        !requiredDungeons_.includes(entry)
                    ) {
                        result[exitId] = {
                            type: 'random',
                            pool: 'dungeons_unrequired' satisfies TrackerLinkedEntrancePool,
                            isKnownIrrelevant: eud,
                        };
                    } else {
                        result[exitId] = { type: 'random', pool };
                    }
                } else {
                    result[exitId] = { type: 'linked', pool, entry };
                }
            } else {
                result[exitId] = { type: 'vanilla' };
            }
            continue;
        }

        if (everythingRandomized) {
            const exitDef = logic.areaGraph.exits[exitId];
            if (
                exitDef.stage === undefined ||
                exitDef.vanilla === undefined ||
                exitId.includes('Pillar')
            ) {
                result[exitId] = { type: 'vanilla' };
            } else {
                result[exitId] = { type: 'random', pool: fullErPool };
            }
            continue;
        }

        result[exitId] = { type: 'vanilla' };
    }

    return result;
}

export function getExits(
    logic: Logic,
    exitRules: Record<string, ExitRule>,
    mappedExits: TrackerState['mappedExits'],
) {
    const result: { [exitId: string]: ExitMapping } = {};
    const rules = Object.entries(exitRules);

    const makeEntrance = (
        entranceId: string | undefined,
    ): ExitMapping['entrance'] => {
        if (!entranceId) {
            return undefined;
        }
        const rawEntrance = logic.areaGraph.entrances[entranceId];
        if (rawEntrance) {
            return {
                id: entranceId,
                name: rawEntrance.short_name,
                region: logic.areaGraph.entranceHintRegions[entranceId],
            };
        } else {
            appError('unknown entrance', entranceId);
        }
    };

    const makeExit = (id: string): ExitMapping['exit'] => ({
        id,
        name: logic.areaGraph.exits[id].short_name,
    });

    // Exit assignment has to happen in this order because there are dependencies
    const assignmentOrder: ExitRule['type'][] = [
        'vanilla',
        'random',
        // these depend on dungeon entrances
        'follow',
        'linked',
        'lmfSecondExit',
    ];

    rules.sort(compareBy(([_, rule]) => assignmentOrder.indexOf(rule.type)));
    for (const [exitId, rule] of rules) {
        switch (rule.type) {
            case 'vanilla':
                result[exitId] = {
                    canAssign: false,
                    entrance: makeEntrance(
                        logic.areaGraph.vanillaConnections[exitId],
                    ),
                    exit: makeExit(exitId),
                    rule,
                };
                break;
            case 'random':
                result[exitId] = {
                    canAssign: true,
                    entrance: makeEntrance(mappedExits[exitId]),
                    exit: makeExit(exitId),
                    rule,
                };
                break;
            case 'follow':
                result[exitId] = {
                    canAssign: false,
                    entrance: result[rule.otherExit].entrance,
                    exit: makeExit(exitId),
                    rule,
                };
                break;
            case 'linked': {
                // This is unfortunately somewhat complex. This might be an exit like "ET - Main Exit",
                // and if the Deep Woods - Exit to SV leads to ET - Main Entrance, then we know this
                // exit leads to Deep Woods - Entrance from SV.
                const location = rule.entry;
                const pool = logic.areaGraph.linkedEntrancePools[rule.pool];
                // This is the corresponding entrance for this exit
                const neededEntrance = pool[location].entrances[0];
                // Find the exit that was mapped to an entrance in this location
                const sourceLocation = Object.entries(pool).find(
                    ([, linkage]) =>
                        result[linkage.exits[0]].entrance?.id ===
                        neededEntrance,
                )?.[0];

                if (!sourceLocation) {
                    result[exitId] = {
                        canAssign: false,
                        entrance: undefined,
                        exit: makeExit(exitId),
                        rule,
                    };
                } else {
                    const reverseEntrance = pool[sourceLocation].entrances[1];
                    result[exitId] = {
                        canAssign: false,
                        entrance: makeEntrance(reverseEntrance),
                        exit: makeExit(exitId),
                        rule,
                    };
                }
                break;
            }
            case 'lmfSecondExit': {
                // LMF's second exit leads to ToT (vanilla) if LMF is at LMF, otherwise it's neutered
                const lmfPool =
                    logic.areaGraph.linkedEntrancePools.dungeons[
                        'Lanayru Mining Facility'
                    ];
                if (
                    result[lmfPool.exits[0]].entrance?.id ===
                    lmfPool.entrances[0]
                ) {
                    // LMF is vanilla
                    result[exitId] = {
                        canAssign: false,
                        entrance: makeEntrance(
                            logic.areaGraph.vanillaConnections[exitId],
                        ),
                        exit: makeExit(exitId),
                        rule,
                    };
                } else {
                    result[exitId] = {
                        canAssign: false,
                        entrance: undefined,
                        exit: makeExit(exitId),
                        rule,
                    };
                }
                break;
            }
        }
    }
    return Object.values(result).sort(compareBy((exit) => !exit.canAssign));
}

export function getUsedEntrances(
    entrancePools: Record<string, EntrancePool>,
    exits: ExitMapping[],
) {
    const result = mapValues(entrancePools, (): string[] => []);

    for (const exit of exits) {
        if (exit.canAssign && exit.entrance) {
            result[exit.rule.pool].push(exit.entrance.id);
        }
    }

    return result;
}
