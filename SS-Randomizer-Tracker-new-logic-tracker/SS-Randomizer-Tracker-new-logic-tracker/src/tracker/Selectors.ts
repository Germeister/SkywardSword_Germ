import { createSelector, lruMemoize } from '@reduxjs/toolkit';
import { compact, groupBy, isEqual, keyBy, partition, sumBy } from 'es-toolkit';
import {
    counterBasisSelector,
    trickSemiLogicSelector,
    trickSemiLogicTrickListSelector,
} from '../customization/Selectors';
import { parseHintsText } from '../hints/HintsParser';
import {
    getAllowedStartingEntrances,
    getEntrancePools,
    getExitRules,
    getExits,
    getUsedEntrances,
} from '../logic/Entrances';
import { type InventoryItem, itemMaxes } from '../logic/Inventory';
import { keyData } from '../logic/KeyLogic';
import {
    type Check,
    type CheckGroup,
    type DungeonName,
    dungeonNames,
    type HintRegion,
    isDungeon,
    type LogicalState,
} from '../logic/Locations';
import type { LogicalCheck } from '../logic/Logic';
import { mapInventory, mapSettings } from '../logic/Mappers';
import {
    getAdditionalItems,
    getNumLooseGratitudeCrystals,
} from '../logic/Misc';
import { exploreAreaGraph } from '../logic/Pathfinding';
import {
    areaGraphSelector,
    logicSelector,
    optionsSelector,
} from '../logic/Selectors';
import {
    computeSemiLogic,
    getVisibleTricksEnabledRequirements,
} from '../logic/SemiLogic';
import { doesHintDistroUseGossipStone } from '../logic/ThingsThatWouldBeNiceToHaveInTheDump';
import {
    cubeCheckToGoddessChestCheck,
    dungeonCompletionItems,
    goddessChestCheckToCubeCheck,
} from '../logic/TrackerModifications';
import {
    computeLeastFixedPoint,
    mergeRequirements,
} from '../logic/bitlogic/BitLogic';
import { BitVector } from '../logic/bitlogic/BitVector';
import { validateSettings } from '../permalink/Settings';
import type { TypedOptions } from '../permalink/SettingsTypes';
import type { RootState } from '../store/Store';
import { emptyArray, mapValues } from '../utils/Collections';
import { stubTrue } from '../utils/Function';
import { currySelector } from '../utils/Redux';

const bitVectorMemoizeOptions = {
    memoizeOptions: {
        resultEqualityCheck: (a: BitVector, b: BitVector) =>
            a instanceof BitVector && b instanceof BitVector && a.equals(b),
    },
};

const parsedHintsSelector = createSelector(
    [(state: RootState) => state.tracker.userHintsText, logicSelector],
    (hintsText, logic) => parseHintsText(hintsText, logic.hintRegions),
    {
        // Make sure we don't accumulate garbage for every single
        // value of the hints text input
        memoize: lruMemoize,
        memoizeOptions: {
            // Skip rerenders if the parsed hints are deeply equal
            resultEqualityCheck: isEqual,
        },
    },
);

/**
 * A map from hint region to all tracked and parsed region hints.
 */
const allAreaHintsSelector = createSelector(
    [
        logicSelector,
        parsedHintsSelector,
        (state: RootState) => state.tracker.hints,
    ],
    (logic, parsed, tracked) =>
        Object.fromEntries(
            logic.hintRegions.map((region) => [
                region,
                [...(tracked[region] ?? []), ...(parsed[region] ?? [])],
            ]),
        ),
);

/**
 * Selects the hint for a given area.
 */
export const areaHintSelector = currySelector(
    createSelector(
        [(_state: RootState, area: string) => area, allAreaHintsSelector],
        (area, hints) => hints[area] ?? emptyArray(),
    ),
);

/**
 * All hinted items.
 */
export const checkHintsSelector = (state: RootState) =>
    state.tracker.checkHints;

/**
 * Selects the hinted item for a given check
 */
export const checkHintSelector = currySelector(
    (state: RootState, checkId: string) => state.tracker.checkHints[checkId],
);

/**
 * Selects ALL settings, even the ones not logically relevant.
 */
export const allSettingsSelector = createSelector(
    [optionsSelector, (state: RootState) => state.tracker.settings],
    validateSettings,
);

/**
 * Selects the current logical settings. This is basically the same
 * thing but differently typed to only provide the subset of logically relevant settings.
 */
export const settingsSelector: (state: RootState) => TypedOptions =
    allSettingsSelector;

/**
 * Selects a particular logical settings value.
 */
export const settingSelector: <K extends keyof TypedOptions>(
    setting: K,
) => (state: RootState) => TypedOptions[K] = currySelector(
    <K extends keyof TypedOptions>(
        state: RootState,
        setting: K,
    ): TypedOptions[K] => settingsSelector(state)[setting],
);

const rawItemCountsSelector = (state: RootState) => state.tracker.inventory;

/** A map of all actual items to their counts. Since redux only stores partial counts, this ensures all items are present. */
const inventorySelector = createSelector(
    [rawItemCountsSelector],
    (rawInventory) =>
        mapValues(itemMaxes, (_val, item) => rawInventory[item] ?? 0),
    { memoizeOptions: { resultEqualityCheck: isEqual } },
);

export const rawItemCountSelector = currySelector(
    (state: RootState, item: InventoryItem) =>
        inventorySelector(state)[item] ?? 0,
);

const checkedChecksSelector = createSelector(
    [(state: RootState) => state.tracker.checkedChecks],
    (checkedChecks) => new Set(checkedChecks),
);

const checkItemsSelector = createSelector(
    [logicSelector, inventorySelector, checkedChecksSelector],
    getAdditionalItems,
    { memoizeOptions: { resultEqualityCheck: isEqual } },
);

export const totalGratitudeCrystalsSelector = createSelector(
    [
        logicSelector,
        checkedChecksSelector,
        rawItemCountSelector('Gratitude Crystal Pack'),
    ],
    (logic, checkedChecks, packCount) => {
        const looseCrystalCount = getNumLooseGratitudeCrystals(
            logic,
            checkedChecks,
        );
        return packCount * 5 + looseCrystalCount;
    },
);

const allowedStartingEntrancesSelector = createSelector(
    [logicSelector, settingSelector('random-start-entrance')],
    getAllowedStartingEntrances,
);

const skyKeepRequiredSelector = (state: RootState) => {
    const settings = settingsSelector(state);
    if (!settings['triforce-required']) {
        return false;
    }
    return settings['triforce-shuffle'] !== 'Anywhere';
};

export const requiredDungeonsSelector = createSelector(
    [
        (state: RootState) => state.tracker.requiredDungeons,
        settingSelector('required-dungeon-count'),
        skyKeepRequiredSelector,
    ],
    (selectedRequiredDungeons, numRequiredDungeons, skyKeepRequired) => {
        // Enforce consistent order
        return dungeonNames.filter((d) =>
            d === 'Sky Keep'
                ? skyKeepRequired
                : numRequiredDungeons === 6 ||
                  selectedRequiredDungeons.includes(d),
        );
    },
);

/**
 * Describes which entrances are available for a given pool (dungeons, silent realms, starting, ...)
 * This is a bit overkill because it keeps all pools available at all times, but it
 * used to be necessary when we allowed context menus to select entrances, since
 * context menus had to be always rendered and there wasn't a way to include
 */
export const entrancePoolsSelector = createSelector(
    [
        areaGraphSelector,
        allowedStartingEntrancesSelector,
        settingSelector('randomize-entrances'),
        settingSelector('randomize-dungeon-entrances'),
        requiredDungeonsSelector,
    ],
    getEntrancePools,
);

const mappedExitsSelector = (state: RootState) => state.tracker.mappedExits;

/** Defines how exits should be resolved. */
const exitRulesSelector = createSelector(
    [
        logicSelector,
        settingSelector('random-start-entrance'),
        settingSelector('randomize-entrances'),
        settingSelector('randomize-dungeon-entrances'),
        settingSelector('randomize-trials'),
        settingSelector('random-start-statues'),
        settingSelector('empty-unrequired-dungeons'),
        requiredDungeonsSelector,
    ],
    getExitRules,
);

export const exitsSelector = createSelector(
    [logicSelector, exitRulesSelector, mappedExitsSelector],
    getExits,
);

export const exitsByIdSelector = createSelector([exitsSelector], (exits) =>
    keyBy(exits, (e) => e.exit.id),
);

/**
 * Selects the requirements that depend on state/settings, but should still be revealed during
 * tooltip computations. Any recalculations here will cause the tooltips cache to throw away its
 * cached tooltips and recalculate requirements (after logic has loaded, this is only settings, mapped exits, and required dungeons).
 */
export const settingsRequirementsSelector = createSelector(
    [
        logicSelector,
        optionsSelector,
        settingsSelector,
        exitsSelector,
        requiredDungeonsSelector,
    ],
    mapSettings,
);

const inventoryRequirementsSelector = createSelector(
    [logicSelector, inventorySelector],
    mapInventory,
);

const checkRequirementsSelector = createSelector(
    [logicSelector, checkItemsSelector],
    mapInventory,
);

export const inLogicBitsSelector = createSelector(
    [
        logicSelector,
        settingsRequirementsSelector,
        inventoryRequirementsSelector,
        checkRequirementsSelector,
    ],
    (logic, settingsRequirements, inventoryRequirements, checkRequirements) =>
        computeLeastFixedPoint(
            'Logical state',
            mergeRequirements(
                logic.numRequirements,
                logic.staticRequirements,
                settingsRequirements,
                inventoryRequirements,
                checkRequirements,
            ),
        ),
    bitVectorMemoizeOptions,
);

const optimisticInventoryItemRequirementsSelector = createSelector(
    [logicSelector],
    (logic) => mapInventory(logic, itemMaxes),
);

/**
 * A selector that computes logical state as if you had gotten every item.
 * Useful for checking if something is out of logic because of missing
 * items or generally unreachable because of missing entrances.
 */
const optimisticLogicBitsSelector = createSelector(
    [
        logicSelector,
        settingsRequirementsSelector,
        optimisticInventoryItemRequirementsSelector,
        // TODO this should probably also treat all check requirements as available? E.g. dungeons completed, cubes gotten?
        checkRequirementsSelector,
        inLogicBitsSelector,
    ],
    (
        logic,
        settingsRequirements,
        optimisticInventoryRequirements,
        checkRequirements,
        inLogicBits,
    ) =>
        computeLeastFixedPoint(
            'Optimistic state',
            mergeRequirements(
                logic.numRequirements,
                logic.staticRequirements,
                settingsRequirements,
                optimisticInventoryRequirements,
                checkRequirements,
            ),
            inLogicBits,
        ),
    bitVectorMemoizeOptions,
);

const skyKeepNonprogressSelector = createSelector(
    [settingsSelector],
    (settings) =>
        settings['empty-unrequired-dungeons'] === true &&
        (settings['triforce-required'] === false ||
            settings['triforce-shuffle'] === 'Anywhere'),
);

const areaNonprogressSelector = createSelector(
    [
        skyKeepNonprogressSelector,
        settingSelector('empty-unrequired-dungeons'),
        requiredDungeonsSelector,
    ],
    (skyKeepNonprogress, emptyUnrequiredDungeons, requiredDungeons) => {
        return (area: string) =>
            area === 'Sky Keep'
                ? skyKeepNonprogress
                : emptyUnrequiredDungeons && isDungeon(area)
                  ? !requiredDungeons.includes(area)
                  : false;
    },
);

const areaHiddenSelector = createSelector(
    [
        areaNonprogressSelector,
        settingSelector('randomize-entrances'),
        settingSelector('randomize-dungeon-entrances'),
    ],
    (areaNonprogress, randomEntranceSetting, randomDungeonEntranceSetting) => {
        const dungeonEntranceSetting =
            randomDungeonEntranceSetting ?? randomEntranceSetting;
        return (area: string) =>
            areaNonprogress(area) &&
            (!isDungeon(area) ||
                (area === 'Sky Keep' &&
                    dungeonEntranceSetting !==
                        'All Surface Dungeons + Sky Keep'));
    },
);

export const isCheckBannedSelector = createSelector(
    [
        logicSelector,
        areaNonprogressSelector,
        settingSelector('excluded-locations'),
        settingSelector('rupeesanity'),
        settingSelector('shopsanity'),
        settingSelector('beedle-shopsanity'),
        settingSelector('rupin-shopsanity'),
        settingSelector('luv-shopsanity'),
        settingSelector('tadtonesanity'),
        settingSelector('treasuresanity-in-silent-realms'),
        settingSelector('trial-treasure-amount'),
        settingSelector('hint-distribution'),
    ],
    (
        logic,
        areaNonprogress,
        bannedLocations,
        rupeeSanity,
        shopSanity,
        beedleShopsanity,
        rupinShopSanity,
        luvShopSanity,
        tadtoneSanity,
        silentRealmTreasuresanity,
        silentRealmTreasureAmount,
        hintDistro,
    ) => {
        const bannedChecks = new Set(bannedLocations);
        const rupeesExcluded =
            rupeeSanity === 'Vanilla' || rupeeSanity === false;
        const maxRelics = silentRealmTreasuresanity
            ? silentRealmTreasureAmount
            : 0;
        const banBeedle =
            shopSanity !== undefined
                ? shopSanity !== true
                : beedleShopsanity !== true;
        const banGearShop = rupinShopSanity !== true;
        const banPotionShop = luvShopSanity !== true;

        const trialTreasurePattern = /Relic (\d+)/;
        const isExcessRelic = (check: LogicalCheck) => {
            if (check.type === 'trial_treasure') {
                const match = check.name.match(trialTreasurePattern);
                return match && parseInt(match[1], 10) > maxRelics;
            }
        };

        const isBannedCubeCheckViaChest = (
            checkId: string,
            check: LogicalCheck,
        ) => {
            return (
                check.type === 'tr_cube' &&
                bannedChecks.has(
                    logic.checks[cubeCheckToGoddessChestCheck[checkId]].name,
                )
            );
        };

        const isBannedChestViaCube = (checkId: string) => {
            const cube = goddessChestCheckToCubeCheck[checkId];
            return cube && areaNonprogress(logic.checks[cube].area!);
        };

        const gossipStoneUsed =
            doesHintDistroUseGossipStone[hintDistro] ?? stubTrue;

        return (checkId: string) => {
            const check = logic.checks[checkId];
            return (
                bannedChecks.has(check.name) ||
                areaNonprogress(logic.checks[checkId].area!) ||
                isExcessRelic(check) ||
                isBannedChestViaCube(checkId) ||
                isBannedCubeCheckViaChest(checkId, check) ||
                (rupeesExcluded && check.type === 'rupee') ||
                (banBeedle && check.type === 'beedle_shop') ||
                (banGearShop && check.type === 'gear_shop') ||
                (banPotionShop && check.type === 'potion_shop') ||
                (!tadtoneSanity && check.type === 'tadtone') ||
                (check.type === 'gossip_stone' && !gossipStoneUsed(checkId))
            );
        };
    },
);

const dungeonKeyLogicSelector = createSelector(
    [
        logicSelector,
        settingSelector('logic-mode'),
        settingSelector('boss-key-mode'),
        settingSelector('small-key-mode'),
        settingsRequirementsSelector,
        checkRequirementsSelector,
        isCheckBannedSelector,
        optimisticLogicBitsSelector,
    ],
    keyData,
);

/** A selector for the requirements that assume every trick enabled in customization is enabled. */
const visibleTricksRequirementsSelector = createSelector(
    [
        logicSelector,
        optionsSelector,
        settingsSelector,
        trickSemiLogicTrickListSelector,
    ],
    getVisibleTricksEnabledRequirements,
);

export const locationsForItemSelector = currySelector(
    createSelector(
        [
            checkHintsSelector,
            logicSelector,
            (_state: RootState, item: InventoryItem) => item,
        ],
        (checkHints, logic, item) =>
            Object.entries(checkHints)
                .filter(([, itemHint]) => itemHint === item)
                .map(([location, _]) => logic.checks[location].name),
    ),
);

const semiLogicBitsSelector = createSelector(
    [
        logicSelector,
        isCheckBannedSelector,
        checkedChecksSelector,
        inventorySelector,
        inLogicBitsSelector,
        dungeonKeyLogicSelector,
        settingsRequirementsSelector,
        checkHintsSelector,
        trickSemiLogicSelector,
        visibleTricksRequirementsSelector,
    ],
    computeSemiLogic,
);

export const getRequirementLogicalStateSelector = createSelector(
    [logicSelector, inLogicBitsSelector, semiLogicBitsSelector],
    (logic, inLogicBits, semiLogicBits) =>
        (requirement: string): LogicalState => {
            const bit = logic.itemBits[requirement];
            return inLogicBits.test(bit)
                ? 'inLogic'
                : semiLogicBits.inSemiLogicBits.test(bit)
                  ? 'semiLogic'
                  : semiLogicBits.inTrickLogicBits.test(bit)
                    ? 'trickLogic'
                    : 'outLogic';
        },
);

export const dungeonCompletedSelector = currySelector(
    createSelector(
        [
            (_state: RootState, name: DungeonName) => name,
            // This dependency is the wrong way around, I think
            checkItemsSelector,
        ],
        (name, checkItems) => Boolean(checkItems[dungeonCompletionItems[name]]),
    ),
);

export const checkSelector = currySelector(
    createSelector(
        [
            (_state: RootState, checkId: string) => checkId,
            logicSelector,
            getRequirementLogicalStateSelector,
            checkedChecksSelector,
            mappedExitsSelector,
        ],
        (
            checkId,
            logic,
            getRequirementLogicalState,
            checkedChecks,
            mappedExits,
        ): Check => {
            const logicalState = getRequirementLogicalState(checkId);

            if (logic.checks[checkId]) {
                const checkName = logic.checks[checkId].name;
                const shortCheckName = checkName.includes('-')
                    ? checkName.substring(checkName.indexOf('-') + 1).trim()
                    : checkName;
                return {
                    checked: checkedChecks.has(checkId),
                    checkId,
                    checkName: shortCheckName,
                    type: logic.checks[checkId].type,
                    logicalState,
                };
            } else if (logic.areaGraph.exits[checkId]) {
                const shortCheckName =
                    logic.areaGraph.exits[checkId].short_name;
                return {
                    checked: Boolean(mappedExits[checkId]),
                    checkId,
                    checkName: shortCheckName,
                    type: 'exit',
                    logicalState,
                };
            } else if (checkId !== '') {
                throw new Error('unknown check ' + checkId);
            }
            return undefined as unknown as Check;
        },
    ),
);

export const areasSelector = createSelector(
    [
        logicSelector,
        checkedChecksSelector,
        exitsSelector,
        isCheckBannedSelector,
        getRequirementLogicalStateSelector,
        areaNonprogressSelector,
        areaHiddenSelector,
        counterBasisSelector,
    ],
    (
        logic,
        checkedChecks,
        allExits,
        isCheckBanned,
        getLogicalState,
        isAreaNonprogress,
        isAreaHidden,
        counterBasis,
    ): HintRegion[] => {
        const exitsById = keyBy(allExits, (e) => e.exit.id);
        return compact(
            logic.hintRegions.map((area): HintRegion | undefined => {
                const checks = logic.checksByHintRegion[area];
                // Loose crystal checks can be banned to not require picking them up
                // in logic, but we want to allow marking them as collected.
                const progressChecks = checks.filter(
                    (check) =>
                        !isCheckBanned(check) ||
                        logic.checks[check].type === 'loose_crystal',
                );

                const [extraChecks, regularChecks_] = partition(
                    progressChecks,
                    (check) =>
                        logic.checks[check].type === 'gossip_stone' ||
                        logic.checks[check].type === 'tr_cube' ||
                        logic.checks[check].type === 'loose_crystal',
                );

                const nonProgress = isAreaNonprogress(area);
                const hidden = isAreaHidden(area);
                const regularChecks = nonProgress ? [] : regularChecks_;
                const shouldCount = (state: LogicalState) =>
                    counterBasis === 'logic'
                        ? state === 'inLogic'
                        : state !== 'outLogic';

                const checkGroup = (checks: string[]): CheckGroup => {
                    const nonBannedChecks = checks.filter(
                        (c) => !isCheckBanned(c),
                    );
                    const remaining = nonBannedChecks.filter(
                        (c) => !checkedChecks.has(c),
                    );
                    const accessible = remaining.filter((c) =>
                        shouldCount(getLogicalState(c)),
                    );
                    return {
                        // Intentionally include banned but shown checks in the list
                        // of checks, but do not count them anywhere!
                        list: checks,
                        numTotal: nonBannedChecks.length,
                        numAccessible: accessible.length,
                        numRemaining: remaining.length,
                    };
                };

                const extraLocations: HintRegion<string>['extraLocations'] =
                    mapValues(
                        groupBy(
                            extraChecks,
                            (check) => logic.checks[check].type,
                        ),
                        checkGroup,
                    );

                const relevantExits = logic.exitsByHintRegion[area].filter(
                    (e) => {
                        const exitMapping = exitsById[e];
                        if (!exitMapping) {
                            return false;
                        }
                        return (
                            exitMapping.canAssign &&
                            exitMapping.rule.type === 'random'
                        );
                    },
                );

                const remainingExits = relevantExits.filter((e) => {
                    const exitMapping = exitsById[e];
                    return !exitMapping.entrance;
                });

                const accessibleExits = remainingExits.filter((e) => {
                    const exitMapping = exitsById[e];
                    return (
                        exitMapping.rule.type === 'random' &&
                        !exitMapping.rule.isKnownIrrelevant &&
                        shouldCount(getLogicalState(e))
                    );
                });

                extraLocations.exits = {
                    list: relevantExits,
                    numAccessible: accessibleExits.length,
                    numRemaining: remainingExits.length,
                    numTotal: relevantExits.length,
                } satisfies CheckGroup;

                return {
                    checks: checkGroup(regularChecks),
                    extraLocations,
                    nonProgress,
                    hidden,
                    name: area,
                };
            }),
        );
    },
);

export const totalCountersSelector = createSelector(
    [areasSelector, exitsByIdSelector],
    (areas, exits) => {
        const numChecked = sumBy(
            areas,
            (a) => a.checks.numTotal - a.checks.numRemaining,
        );
        const numAccessible = sumBy(areas, (a) => a.checks.numAccessible);
        const numRemaining = sumBy(areas, (a) => a.checks.numRemaining);
        let numExitsAccessible = sumBy(
            areas,
            (a) => a.extraLocations.exits?.numAccessible ?? 0,
        );

        const startMapping = exits['\\Start'];
        const needsStartingEntrance = !startMapping.entrance;
        if (needsStartingEntrance) {
            numExitsAccessible++;
        }
        return {
            numChecked,
            numAccessible,
            numRemaining,
            numExitsAccessible,
        };
    },
);

export const usedEntrancesSelector = createSelector(
    [entrancePoolsSelector, exitsSelector],
    getUsedEntrances,
);

export const inLogicPathfindingSelector = createSelector(
    [areaGraphSelector, exitsSelector, inLogicBitsSelector],
    exploreAreaGraph,
);

export const optimisticPathfindingSelector = createSelector(
    [areaGraphSelector, exitsSelector, optimisticLogicBitsSelector],
    exploreAreaGraph,
);
