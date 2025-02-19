import { groupBy, last } from 'es-toolkit';
import { isEmpty, mapValues } from '../utils/Collections';
import { chainComparators, compareBy } from '../utils/Compare';
import { appDebug, appWarn } from '../utils/Debug';
import {
    mergeRequirements,
    removeDuplicates,
    shallowSimplify,
    unifyRequirements,
    type Requirements,
} from './bitlogic/BitLogic';
import { BitVector } from './bitlogic/BitVector';
import { LogicalExpression } from './bitlogic/LogicalExpression';
import {
    booleanExprToLogicalExpr,
    parseExpression,
} from './booleanlogic/ExpressionParse';
import { itemName } from './Inventory';
import { dungeonNames } from './Locations';
import { LogicBuilder } from './LogicBuilder';
import { TimeOfDay, type TTimeOfDay } from './Mappers';
import {
    cubeCheckToCubeCollected,
    cubeCollectedToCubeCheck,
    dungeonCompletionItems,
} from './TrackerModifications';
import type {
    RawArea,
    RawEntrance,
    RawExit,
    RawLogic,
    TimeOfDayInt,
} from './UpstreamTypes';

export interface Logic {
    numRequirements: number;
    staticRequirements: Requirements;

    allItems: string[];
    itemLookup: Record<string, number>;
    /**
     * Requirements that will always imply each other by construction. Progressive Sword x 2 will always
     * imply Progressive Sword x 1.
     * A map from item K to other items V such that for every V: V -> K
     */
    impliedBy: Record<string, string[]>;
    /** Maps from items K to items V such that for every V: K -> V */
    implies: Record<string, string[]>;
    itemBits: Record<string, number>;
    areaGraph: AreaGraph;
    checks: Record<string, LogicalCheck>;
    hintRegions: string[];
    checksByHintRegion: Record<string, string[]>;
    exitsByHintRegion: Record<string, string[]>;
    dungeonCompletionRequirements: { [dungeon: string]: string };
}

export interface LogicalCheck {
    type:
        | 'regular'
        | 'loose_crystal'
        | 'gossip_stone'
        | 'trial_treasure'
        | 'rupee'
        | 'tadtone'
        | 'beedle_shop'
        | 'gear_shop'
        | 'potion_shop'
        | 'tr_cube'
        | 'tr_dummy';
    name: string;
    originalItem: string | undefined;
    area: string | undefined;
}

/**
 * 'abstract' locations are always (don't have to be in the area) available (modulo requirements).
 * Time-of-day-restricted locations are only available if you can logically reach the area
 * with the correct time of day.
 */
export type LocationAvailability = TimeOfDayInt | 'abstract';

export type LinkedEntrancePool = keyof RawLogic['linked_entrances'];
export type TrackerLinkedEntrancePool =
    | LinkedEntrancePool
    | 'dungeons_unrequired';

/**
 * Is this a check that can contain mostly any random item, assuming it is unbanned?
 */
export function isRegularItemCheck(type: LogicalCheck['type']) {
    switch (type) {
        case 'regular':
        case 'trial_treasure':
        case 'rupee':
        case 'tadtone':
        case 'beedle_shop':
        case 'gear_shop':
        case 'potion_shop':
            return true;
        case 'loose_crystal':
        case 'gossip_stone':
        case 'tr_cube':
        case 'tr_dummy':
            return false;
    }
}

/**
 * The AreaGraph is a parsed dump with some preprocessing for TimeOfDay logic.
 * This graph will be mapped to a self-contained BitLogic for logical state.
 * The BitLogic results can the be used to interpret edges in this graph.
 *
 * This area graph maintains the structure of the area requirements, which could help
 * implementing a more structured grounding algorithm for tooltip requirements in the future.
 */
export interface AreaGraph {
    rootArea: Area;
    areas: Record<string, Area>;
    areasByEntrance: Record<string, Area>;
    areasByExit: Record<string, Area>;
    vanillaConnections: { [from: string]: string };
    entrances: Record<string, RawEntrance>;
    entranceHintRegions: Record<string, string>;
    exits: Record<string, RawExit>;

    /** Sandship Dock Exit -> Exit to Sandship */
    autoExits: {
        [canonicalExit: string]: string;
    };
    /**
     * Linked entrance pools are Dungeons and Silent Realms,
     * where interior exits follow exterior exit choice.
     */
    linkedEntrancePools: {
        [key in keyof RawLogic['linked_entrances']]: Record<
            string,
            EntranceLinkage
        >;
    };
    /**
     * An entrance pool without linkage.
     */
    birdStatueSanity: {
        [pool: string]: { exit: string; entrances: string[] };
    };
}

export interface EntranceLinkage {
    /** Deep Woods\Exit to SV -> SV\Exit to Deep Woods  */
    exits: [outsideExit: string, insideExit: string];
    /** SV\Main Entrance -> Deep Woods\Entrance from SV  */
    entrances: [insideEntrance: string, outsideEntrance: string];
}

export type DayNightRequirements = {
    day: LogicalExpression;
    night: LogicalExpression;
};

interface CommonArea {
    abstract: boolean;
    id: string;
    subAreas: Record<string, Area>;
    availability: LocationAvailability;
    canSleep: boolean;
    /** The possible ways to get into this area, an entry in Logic.entrances */
    entrances: string[];
}

/**
 * An area where both day and night are logically allowed. Exits and checks
 * have separate requirements for the day and the night state.
 * The actual area name doesn't exist in logic, instead we have _DAY and _NIGHT versions.
 */
export interface DualTodArea extends CommonArea {
    availability: TTimeOfDay['Both'];
    locations: Location<DayNightRequirements, TTimeOfDay['Both']>[];
    abstract: false;
}

/**
 * An area where either only day or only night are logically allowed.
 * Exits and checks have a single expression that is calculated
 * assuming you are in this area with the allowed ToD. Getting there
 * with the opposite ToD is an immediate out-of-logic.
 */
export interface SingleTodArea extends CommonArea {
    availability: TTimeOfDay['DayOnly'] | TTimeOfDay['NightOnly'];
    locations: Location<
        LogicalExpression,
        TTimeOfDay['DayOnly'] | TTimeOfDay['NightOnly']
    >[];
    canSleep: false;
    abstract: false;
}

/**
 * An area where either only day or only night are logically allowed.
 * Exits and checks have a single expression that is calculated
 * assuming you are in this area with the allowed ToD. Getting there
 * with the opposite ToD is an immediate out-of-logic.
 */
export interface AbstractArea extends CommonArea {
    availability: 'abstract';
    locations: Location<LogicalExpression, 'abstract'>[];
    canSleep: false;
    abstract: true;
}

export type Area = DualTodArea | SingleTodArea | AbstractArea;

/** A single logical location. Can be an actual check, an arbitrary "location", a map exit, or a logical exit. */
interface AbstractLocation<R, T extends LocationAvailability> {
    /** The fully resolved check/exit/location id. */
    id: string;
    /** The actual requirements expression(s) to get this location... */
    requirements: R;
    /** ...from its owning area with this Time of Day. */
    areaAvailability: T;
}

interface MapExit<R, T extends LocationAvailability>
    extends AbstractLocation<R, T> {
    type: 'mapExit';
}

interface LogicalExit<R, T extends LocationAvailability>
    extends AbstractLocation<R, T> {
    type: 'logicalExit';
    /** The destination area. */
    toArea: string;
}

interface VirtualLocation<R, T extends LocationAvailability>
    extends AbstractLocation<R, T> {
    type: 'virtualLocation';
}

interface CheckRenameMe<R, T extends LocationAvailability>
    extends AbstractLocation<R, T> {
    type: 'check';
    /** Whether this instance of the location was the primary (unprefixed) mention. */
    isPrimaryLocation: boolean;
}

type Location<R, T extends LocationAvailability> =
    | MapExit<R, T>
    | LogicalExit<R, T>
    | VirtualLocation<R, T>
    | CheckRenameMe<R, T>;

const itemIndexPat = /^(.+) #(\d+)$/;

function splitItemIndex(
    item: string,
): [item: string, index: number | undefined] {
    const match = item.match(itemIndexPat);
    if (!match) {
        return [item, undefined];
    } else {
        return [match[1], parseInt(match[2], 10)];
    }
}

const excludedItemPrefixes = [
    'Blue Rupee #',
    'Dusk Relic #',
    'Eldin Ore #',
    'Evil Crystal #',
    'Gold Rupee #',
    'Green Rupee #',
    'Heart Container #',
    'Heart Piece #',
    'Rare Treasure #',
    'Red Rupee #',
    'Semi Rare Treasure #',
    'Silver Rupee #',
    'Hint #',
];

/**
 * Turns all "<Item> #<number>" requirements into "<Item> x <number+1>"
 * requirements - this works better with the tracker.
 *
 * Also filters out items the tracker doesn't really interact with, such as
 * hint items, treasures, ... which cuts about 400 bits from our logic.
 */
function preprocessItems(raw: string[]): {
    newItems: string[];
    impliedBy: Logic['impliedBy'];
    implies: Logic['implies'];
} {
    const impliedBy: Logic['impliedBy'] = {};
    const implies: Logic['implies'] = {};
    const newItems = raw
        .filter((item) => !excludedItemPrefixes.some((p) => item.startsWith(p)))
        .map((rawItem) => {
            const [item, index] = splitItemIndex(rawItem);
            if (index === undefined) {
                return rawItem;
            } else {
                const amount = index + 1;

                for (let i = 0; i <= amount; i++) {
                    (impliedBy[itemName(item, i)] ??= []).push(
                        itemName(item, amount),
                    );
                    (implies[itemName(item, amount)] ??= []).push(
                        itemName(item, i),
                    );
                }

                return itemName(item, amount);
            }
        });

    return { newItems, impliedBy, implies };
}

const checkAreaPlaceholder = 'filled-in-later';

export function parseLogic(raw: RawLogic): Logic {
    const start = performance.now();

    const { newItems, impliedBy, implies } = preprocessItems(raw.items);
    const rawItems = [
        ...newItems,
        ...Object.keys(cubeCollectedToCubeCheck),
        ...Object.values(dungeonCompletionItems),
    ];

    // Pessimistically, all items are opaque
    const opaqueItems = new BitVector();
    for (let i = 0; i < rawItems.length; i++) {
        opaqueItems.setBit(i);
    }

    const checks: Logic['checks'] = mapValues(raw.checks, (check) => {
        const item = check['original item']
            ? splitItemIndex(check['original item'])[0]
            : undefined;
        return {
            name: check.short_name,
            type: getCheckType(check.short_name, check.type),
            originalItem: item,
            area: checkAreaPlaceholder,
        } as const;
    });

    for (const [cubeItem, cubeCheck] of Object.entries(
        cubeCollectedToCubeCheck,
    )) {
        checks[cubeCheck] = {
            type: 'tr_cube',
            name: last(cubeCheck.split('\\'))!,
            originalItem: undefined,
            area: checkAreaPlaceholder,
        };
        checks[cubeItem] = {
            type: 'tr_dummy',
            name: last(cubeCheck.split('\\'))!,
            originalItem: undefined,
            area: undefined,
        };
    }

    for (const [gossipStoneId, gossipStoneName] of Object.entries(
        raw.gossip_stones,
    )) {
        checks[gossipStoneId] = {
            type: 'gossip_stone',
            name: gossipStoneName,
            originalItem: undefined,
            area: checkAreaPlaceholder,
        };
    }

    for (const [dungeon, req] of Object.entries(dungeonCompletionItems)) {
        checks[req] = {
            name: `${dungeon} Completed`,
            type: 'tr_dummy',
            originalItem: undefined,
            area: undefined,
        };
    }

    const numItems = rawItems.length;
    const staticRequirements: Requirements = {};

    const itemBits: Logic['itemBits'] = {};
    const areasByExit: AreaGraph['areasByExit'] = {};
    const checksByHintRegion: Logic['checksByHintRegion'] = {};
    const exitsByHintRegion: Logic['exitsByHintRegion'] = {};
    const entranceHintAreas: AreaGraph['entranceHintRegions'] = {};

    const entrancesByShortName: {
        [shortName: string]: { def: RawEntrance; id: string; region: string };
    } = {};
    let idx = 0;
    for (const rawItem of rawItems) {
        itemBits[rawItem] = idx;
        idx++;
    }

    const dummyDayBit = itemBits['Day'];
    const dummyNightBit = itemBits['Night'];
    opaqueItems.clearBit(dummyDayBit);
    opaqueItems.clearBit(dummyNightBit);

    const allAreas: AreaGraph['areas'] = {};

    const parseExpr = (expr: string) => {
        const terms = booleanExprToLogicalExpr(
            parseExpression(expr),
            (item: string) => {
                if (raw.checks[item]) {
                    // check whether a check is mentioned by requirements.
                    // This should not be a thing because it means that the location
                    // cannot be banned. Again something the rando should enforce...
                    appWarn(
                        'check location',
                        raw.checks[item].short_name,
                        'is mentioned by a requirement, which makes it unbannable',
                    );
                }
                // If an expression looks at "goddess cube in X", require the actual item instead.
                const actualItem = cubeCheckToCubeCollected[item] ?? item;
                return itemBits[actualItem];
            },
        );
        // At this point, our requirements have dominators not included - some things may require
        // $Item x 2 while others require $Item x 1, and there's no connection between
        // the two yet. This step adds Item x 1 to all Item x 2 requirements.
        // This allows simplifying some requirements, e.g.:
        //     (Upgraded Skyward Strike option and Goddess Sword) or True Master Sword
        // for sending a skyward strike across a long distance.
        // At some point later, this will look like:
        //     (Upgraded Skyward Strike option and Progressive Sword and Progressive Sword x 2) or
        //     (Progressive Sword and Progressive Sword x 2 and ... and Progressive Sword x 6).
        // Once we know that `Upgraded Skyward Strike option` is true, subsequent simplification steps (`removeDuplicates`)
        // can turn this into (Progressive Sword and Progressive Sword x 2) since it's easier to satisfy.
        for (const conj of terms) {
            for (const bit of conj.iter()) {
                const alsoRequired = implies[rawItems[bit]];
                if (alsoRequired?.length) {
                    for (const otherTerm of alsoRequired) {
                        conj.setBit(itemBits[otherTerm]);
                    }
                }
            }
        }
        return new LogicalExpression(terms);
    };

    // Locations found in areas where we didn't find a corresponding check.
    // We better mention this "virtual" check in some other requirement.
    const nonCheckLocations = new Set<string>();

    function createAreaIndex(rawArea: RawArea) {
        let area: Area;
        if (rawArea.abstract) {
            if (rawArea.can_sleep) {
                throw new Error(`cannot sleep in ${rawArea.name}`);
            }
            area = {
                abstract: rawArea.abstract,
                id: rawArea.name,
                availability: 'abstract',
                canSleep: rawArea.can_sleep,
                locations: [],
                entrances: [],
                subAreas: {},
            } satisfies AbstractArea;
        } else if (rawArea.allowed_time_of_day === TimeOfDay.Both) {
            area = {
                abstract: rawArea.abstract,
                id: rawArea.name,
                availability: rawArea.allowed_time_of_day,
                canSleep: rawArea.can_sleep,
                locations: [],
                entrances: [],
                subAreas: {},
            } satisfies DualTodArea;
        } else {
            if (rawArea.can_sleep) {
                throw new Error(`cannot sleep in ${rawArea.name}`);
            }
            area = {
                abstract: rawArea.abstract,
                id: rawArea.name,
                availability: rawArea.allowed_time_of_day,
                canSleep: rawArea.can_sleep,
                locations: [],
                entrances: [],
                subAreas: {},
            } satisfies SingleTodArea;
        }
        allAreas[area.id] = area;
        if (!isEmpty(rawArea.sub_areas)) {
            for (const rawSubArea of Object.values(rawArea.sub_areas)) {
                const subArea = createAreaIndex(rawSubArea);
                area.subAreas[rawSubArea.name] = subArea;
            }
        }

        return area;
    }

    function toSingleTodExpr(
        tod: TTimeOfDay['DayOnly'] | TTimeOfDay['NightOnly'] | 'abstract',
        expr: LogicalExpression,
    ): LogicalExpression {
        if (tod === 'abstract') {
            return expr;
        } else if (tod === TimeOfDay.DayOnly) {
            return expr.drop_unless(dummyDayBit, dummyNightBit);
        } else {
            return expr.drop_unless(dummyNightBit, dummyDayBit);
        }
    }

    function toDualTodExpr(
        _tod: TTimeOfDay['Both'],
        expr: LogicalExpression,
    ): DayNightRequirements {
        return {
            day: expr.drop_unless(dummyDayBit, dummyNightBit),
            night: expr.drop_unless(dummyNightBit, dummyDayBit),
        };
    }

    /**
     * Recursively populate the area graph.
     */
    function populateArea(rawArea: RawArea): Area {
        const area = allAreas[rawArea.name];
        if (!isEmpty(rawArea.sub_areas)) {
            for (const rawSubArea of Object.values(rawArea.sub_areas)) {
                populateArea(rawSubArea);
            }
        }

        const getHintRegion = (locationId: string) => {
            let region: string | null | undefined = rawArea.hint_region;
            if (
                !region &&
                (locationId.includes('Temple of Time') ||
                    locationId.includes('Goddess Cube at Ride') ||
                    locationId.includes('Gossip Stone in Temple of Time Area'))
            ) {
                // The data has been fixed but we support old versions
                region = 'Lanayru Desert';
            }

            if (
                region === 'Eldin Volcano' &&
                (locationId.includes('Gossip Stone in Upper Platform Cave') ||
                    locationId.includes('Gossip Stone in Lower Platform Cave'))
            ) {
                // TODO discuss changing the upstream data
                region = 'Bokoblin Base';
            }

            if (!region) {
                throw new Error(`check ${locationId} has no region?`);
            }
            return region;
        };

        if (rawArea.exits) {
            for (const [exit, exitRequirementExpression] of Object.entries(
                rawArea.exits,
            )) {
                const expr = parseExpr(exitRequirementExpression);
                const fullExitName = exit.startsWith('\\')
                    ? exit
                    : `${rawArea.name}\\${exit}`;
                if (allAreas[fullExitName]) {
                    // logical exit
                    const destArea = allAreas[fullExitName];
                    if (area.availability === 'abstract') {
                        throw new Error('abstract area cannot have map exits');
                    } else if (area.availability === TimeOfDay.Both) {
                        area.locations.push({
                            type: 'logicalExit',
                            id: fullExitName,
                            toArea: destArea.id,
                            requirements: toDualTodExpr(
                                area.availability,
                                expr,
                            ),
                            areaAvailability: area.availability,
                        });
                    } else {
                        area.locations.push({
                            type: 'logicalExit',
                            id: fullExitName,
                            toArea: destArea.id,
                            requirements: toSingleTodExpr(
                                area.availability,
                                expr,
                            ),
                            areaAvailability: area.availability,
                        });
                    }
                } else if (raw.exits[fullExitName]) {
                    // map exit
                    areasByExit[fullExitName] = area;

                    if (area.availability === 'abstract') {
                        if (fullExitName !== '\\Start') {
                            throw new Error(
                                'abstract area may only lead to start exit',
                            );
                        }
                        area.locations.push({
                            type: 'mapExit',
                            id: fullExitName,
                            requirements: expr,
                            areaAvailability: 'abstract',
                        });
                    } else if (area.availability === TimeOfDay.Both) {
                        area.locations.push({
                            type: 'mapExit',
                            id: fullExitName,
                            requirements: toDualTodExpr(
                                area.availability,
                                expr,
                            ),
                            areaAvailability: area.availability,
                        });
                    } else {
                        area.locations.push({
                            type: 'mapExit',
                            id: fullExitName,
                            requirements: toSingleTodExpr(
                                area.availability,
                                expr,
                            ),
                            areaAvailability: area.availability,
                        });
                    }

                    if (!area.abstract) {
                        const region = getHintRegion(fullExitName);
                        (exitsByHintRegion[region] ??= []).push(fullExitName);
                    }
                } else {
                    throw new Error(
                        `${rawArea.name} area ${fullExitName} not resolved`,
                    );
                }
            }
        }

        if (rawArea.entrances) {
            for (const entrance of rawArea.entrances) {
                area.entrances.push(`${rawArea.name}\\${entrance}`);

                const entranceId = `${rawArea.name}\\${entrance}`;
                const entranceDef = raw.entrances[entranceId];

                const region = getHintRegion(entranceId);
                entranceHintAreas[entranceId] = region;

                // Are both of these needed???

                entrancesByShortName[entranceDef.short_name] = {
                    def: entranceDef,
                    id: entranceId,
                    region,
                };

                entrancesByShortName[entrance] = {
                    def: entranceDef,
                    id: entranceId,
                    region,
                };
            }
        }

        if (rawArea.locations) {
            for (const [
                location,
                locationRequirementExpression,
            ] of Object.entries(rawArea.locations)) {
                const locationId = location.startsWith('\\')
                    ? location
                    : `${area.id}\\${location}`;

                const expr = parseExpr(locationRequirementExpression);

                const check: LogicalCheck | undefined = checks[locationId];
                const isPrimaryLocation = check && !location.startsWith('\\');
                if (check) {
                    if (isPrimaryLocation) {
                        const region = getHintRegion(locationId);
                        if (check.type === 'tr_cube') {
                            check.name = `${region} - ${check.name}`;
                        }
                        check.area = region;
                        // areaByLocation[locName] = area.name;
                        (checksByHintRegion[region] ??= []).push(locationId);
                    }
                } else {
                    nonCheckLocations.add(locationId);
                }

                if (area.availability === 'abstract') {
                    if (check) {
                        throw new Error('abstract location cannot own a check');
                    }
                    area.locations.push({
                        type: 'virtualLocation',
                        id: locationId,
                        requirements: expr,
                        areaAvailability: 'abstract',
                    });
                } else if (area.availability === TimeOfDay.Both) {
                    area.locations.push({
                        type: check ? 'check' : 'virtualLocation',
                        id: locationId,
                        isPrimaryLocation,
                        requirements: toDualTodExpr(area.availability, expr),
                        areaAvailability: area.availability,
                    });
                } else {
                    area.locations.push({
                        type: check ? 'check' : 'virtualLocation',
                        id: locationId,
                        isPrimaryLocation,
                        requirements: toSingleTodExpr(area.availability, expr),
                        areaAvailability: area.availability,
                    });
                }
            }
        }

        return area;
    }

    createAreaIndex(raw.areas);
    const rootArea = populateArea(raw.areas);
    if (!rootArea.abstract) {
        throw new Error('rootArea must be abstract');
    }

    const areasByEntrance: AreaGraph['areasByEntrance'] = {};
    for (const area of Object.values(allAreas)) {
        for (const entrance of area.entrances) {
            areasByEntrance[entrance] = area;
        }
    }

    // These validations aren't really needed for the tracker, but they were useful
    // when initially parsing the dump and they did catch some rando data bugs.
    // Ideally this could be uplifted into the rando?
    for (const area of Object.values(allAreas)) {
        for (const entrance of area.entrances) {
            if (!raw.entrances[entrance]) {
                throw new Error(`entrance ${entrance} does not exist`);
            }
        }
        for (const location of area.locations) {
            switch (location.type) {
                case 'logicalExit': {
                    const targetArea = allAreas[location.toArea];
                    if (!targetArea) {
                        throw new Error(
                            `${area.id} -> exit to area ${location.toArea} does not exist`,
                        );
                    } else if (targetArea.abstract) {
                        throw new Error(
                            `${area.id} -> exit to area ${location.toArea} leads to abstract area`,
                        );
                    }
                    break;
                }
                case 'mapExit': {
                    const connector = raw.exits[location.id];
                    if (!connector) {
                        throw new Error(
                            `exit to connector ${location.id} does not exist`,
                        );
                    }
                    break;
                }
            }
        }
    }

    // Ensure we discovered all checks in our logical requirements
    if (Object.values(checks).some((c) => c.area === checkAreaPlaceholder)) {
        throw new Error('could not discover check area');
    }

    const vanillaConnections: AreaGraph['vanillaConnections'] = {};
    for (const [exitId, exitDef] of Object.entries(raw.exits)) {
        if (exitDef.vanilla) {
            vanillaConnections[exitId] =
                entrancesByShortName[exitDef.vanilla].id;
        }
    }

    const autoExits: AreaGraph['autoExits'] = {};
    const linkedEntrancePools: AreaGraph['linkedEntrancePools'] = {
        dungeons: {},
        silent_realms: {},
    };

    for (const pool of ['silent_realms', 'dungeons'] as const) {
        const data = raw.linked_entrances[pool];
        for (const [location, entry] of Object.entries(data)) {
            if (typeof entry.exit_from_outside !== 'string') {
                autoExits[entry.exit_from_outside[0]] =
                    entry.exit_from_outside[1];
            }
            const canonicalExit =
                typeof entry.exit_from_outside === 'string'
                    ? entry.exit_from_outside
                    : entry.exit_from_outside[0];

            linkedEntrancePools[pool][location] = {
                entrances: [
                    vanillaConnections[canonicalExit],
                    vanillaConnections[entry.exit_from_inside],
                ],
                exits: [canonicalExit, entry.exit_from_inside],
            };
        }
    }

    const birdStatueSanity: AreaGraph['birdStatueSanity'] = {};
    const raiseMissingProvince = (entrance: RawEntrance) => {
        throw new Error(
            `bird statue entrance ${entrance.short_name} is missing a province`,
        );
    };
    const allBirdStatues = groupBy(
        Object.entries(raw.entrances).filter(
            ([, entrance]) =>
                entrance.subtype === 'bird-statue-entrance' &&
                !entrance.short_name.includes('Fire Sanctuary'),
        ),
        ([, entrance]) => entrance.province ?? raiseMissingProvince(entrance),
    );

    for (const [exitId, exitDef] of Object.entries(raw.exits)) {
        const province = exitDef['pillar-province'];
        if (province) {
            birdStatueSanity[province] = {
                exit: exitId,
                entrances: allBirdStatues[province].map(
                    (e) => entrancesByShortName[e[1].short_name].id,
                ),
            };
        }
    }

    const areaGraph: AreaGraph = {
        areas: allAreas,
        rootArea,
        areasByEntrance,
        areasByExit,
        entranceHintRegions: entranceHintAreas,
        entrances: raw.entrances,
        exits: raw.exits,
        vanillaConnections,
        autoExits,
        linkedEntrancePools,
        birdStatueSanity,
    };

    const itemLookup = rawItems.reduce<Logic['itemLookup']>((acc, val, idx) => {
        acc[val] = idx;
        return acc;
    }, {});

    // Now map our area graph to BitLogic
    const newBuilder = new LogicBuilder(
        rawItems,
        itemLookup,
        staticRequirements,
    );
    mapAreaToBitLogic(newBuilder, areaGraph, opaqueItems);

    // check for orphaned locations. This again should probably not be in here
    // but in the rando instead...
    const mentionedBits = new Set(
        Object.values(staticRequirements).flatMap((expr) =>
            expr.conjunctions.flatMap((vec) => [...vec.iter()]),
        ),
    );

    for (const loc of nonCheckLocations) {
        if (!mentionedBits.has(itemBits[loc])) {
            appWarn('unused location', loc);
        }
    }

    const dungeonOrder: readonly string[] = dungeonNames;

    const rawCheckOrder = Object.keys(raw.checks);
    for (const area of Object.keys(checksByHintRegion)) {
        checksByHintRegion[area].sort(
            compareBy((check) => {
                const idx = rawCheckOrder.indexOf(check);
                return idx !== -1 ? idx : Number.MAX_SAFE_INTEGER;
            }),
        );
    }

    const areas = Object.keys(checksByHintRegion);
    areas.sort(
        chainComparators(
            compareBy((area) => dungeonOrder.indexOf(area)),
            compareBy((area) =>
                rawCheckOrder.indexOf(checksByHintRegion[area][0]),
            ),
        ),
    );

    const bitLogic = mergeRequirements(numItems, staticRequirements);

    // Some cheap optimizations - these have opaque entrances,
    // so not much opportunity here.
    do {
        removeDuplicates(bitLogic);
        while (shallowSimplify(opaqueItems, bitLogic)) {
            removeDuplicates(bitLogic);
        }
    } while (unifyRequirements(opaqueItems, bitLogic));

    // In theory, we could also do some more aggressive optimizations
    // with opaque entrances but we do have to be mindful of the size
    // of our resulting expressions, otherwise subsequent tooltip
    // calculations will be difficult to execute in a performant manner.
    // As it turns out, "just walking somewhere in-game" is a great way
    // to meet a lot of requirements when entrances are revealed, but with opaque
    // entrances, every entrance has to be considered uniquely reachable with no way
    // to bound our exploration or to simplify these expressions as we go.

    const updatedRequirements = mapValues(
        staticRequirements,
        (_value, idx) => bitLogic[parseInt(idx, 10)],
    );

    appDebug('logic building took', performance.now() - start, 'ms');

    return {
        numRequirements: rawItems.length,
        staticRequirements: updatedRequirements,
        allItems: rawItems,
        itemLookup,
        impliedBy,
        implies,
        itemBits,
        checks,
        hintRegions: areas,
        checksByHintRegion,
        exitsByHintRegion,
        dungeonCompletionRequirements: raw.dungeon_completion_requirements,
        areaGraph,
    };
}

function mapAreaToBitLogic(
    b: LogicBuilder,
    areaGraph: AreaGraph,
    opaqueItems: BitVector,
    area = areaGraph.rootArea,
) {
    for (const subArea of Object.values(area.subAreas)) {
        mapAreaToBitLogic(b, areaGraph, opaqueItems, subArea);
    }

    if (area.canSleep) {
        b.addAlternative(b.day(area.id), b.singleBit(b.night(area.id)));
        b.addAlternative(b.night(area.id), b.singleBit(b.day(area.id)));
    }

    for (const location of area.locations) {
        switch (location.type) {
            case 'check':
            case 'virtualLocation':
            case 'mapExit':
                {
                    const locName = location.id;
                    // Hack: We keep these virtual locations opaque...
                    if (
                        !locName.endsWith('Gratitude Crystals') &&
                        !locName.includes("\\Gondo's Upgrades\\Upgrade to")
                    ) {
                        opaqueItems.clearBit(b.bit(locName));
                    }

                    if (location.areaAvailability === 'abstract') {
                        b.addAlternative(locName, location.requirements);
                    } else if (location.areaAvailability === TimeOfDay.Both) {
                        b.addAlternative(
                            locName,
                            location.requirements.day.and(
                                b.singleBit(b.day(area.id)),
                            ),
                        );
                        b.addAlternative(
                            locName,
                            location.requirements.night.and(
                                b.singleBit(b.night(area.id)),
                            ),
                        );
                    } else {
                        b.addAlternative(
                            locName,
                            location.requirements.and(b.singleBit(area.id)),
                        );
                    }
                }
                break;
            case 'logicalExit':
                {
                    const destArea = areaGraph.areas[location.toArea];
                    if (
                        destArea.availability === 'abstract' ||
                        location.areaAvailability === 'abstract'
                    ) {
                        throw new Error(
                            'abstract areas cannot have logical exits between them',
                        );
                    }
                    if (destArea.availability === TimeOfDay.Both) {
                        opaqueItems.clearBit(b.bit(b.day(destArea.id)));
                        opaqueItems.clearBit(b.bit(b.night(destArea.id)));

                        if (location.areaAvailability === TimeOfDay.Both) {
                            b.addAlternative(
                                b.day(destArea.id),
                                location.requirements.day.and(
                                    b.singleBit(b.day(area.id)),
                                ),
                            );
                            b.addAlternative(
                                b.night(destArea.id),
                                location.requirements.night.and(
                                    b.singleBit(b.night(area.id)),
                                ),
                            );
                        } else if (
                            location.areaAvailability === TimeOfDay.DayOnly
                        ) {
                            b.addAlternative(
                                b.day(destArea.id),
                                location.requirements.and(b.singleBit(area.id)),
                            );
                        } else {
                            b.addAlternative(
                                b.night(destArea.id),
                                location.requirements.and(b.singleBit(area.id)),
                            );
                        }
                    } else {
                        opaqueItems.clearBit(b.bit(destArea.id));

                        if (location.areaAvailability === TimeOfDay.Both) {
                            const [timedReq, timedArea] =
                                destArea.availability === TimeOfDay.DayOnly
                                    ? [
                                          location.requirements.day,
                                          b.day(area.id),
                                      ]
                                    : [
                                          location.requirements.night,
                                          b.night(area.id),
                                      ];
                            b.addAlternative(
                                destArea.id,
                                timedReq.and(b.singleBit(timedArea)),
                            );
                        } else if (
                            location.areaAvailability === destArea.availability
                        ) {
                            b.addAlternative(
                                destArea.id,
                                location.requirements.and(b.singleBit(area.id)),
                            );
                        } else {
                            throw new Error('impossible logical connection');
                        }
                    }
                }
                break;
        }
    }

    for (const entrance of area.entrances) {
        const entranceDef = areaGraph.entrances[entrance];
        if (entranceDef.allowed_time_of_day === TimeOfDay.Both) {
            b.addAlternative(b.day(area.id), b.singleBit(b.day(entrance)));
            b.addAlternative(b.night(area.id), b.singleBit(b.night(entrance)));
            opaqueItems.clearBit(b.bit(b.day(area.id)));
            opaqueItems.clearBit(b.bit(b.night(area.id)));
        } else {
            let areaReq: string;
            if (area.availability === TimeOfDay.Both) {
                if (entranceDef.allowed_time_of_day === TimeOfDay.DayOnly) {
                    areaReq = b.day(area.id);
                } else if (
                    entranceDef.allowed_time_of_day === TimeOfDay.NightOnly
                ) {
                    areaReq = b.night(area.id);
                } else {
                    throw new Error('bad ToD requirement');
                }
            } else {
                areaReq = area.id;
            }
            b.addAlternative(areaReq, b.singleBit(entrance));
            opaqueItems.clearBit(b.bit(areaReq));
        }
    }
}

function getCheckType(
    checkName: string,
    checkType: string | null,
): LogicalCheck['type'] {
    if (!checkType) {
        return 'regular';
    }

    if (checkType.includes('Rupee')) {
        return 'rupee';
    } else if (checkType.includes('silent realm')) {
        return 'trial_treasure';
    } else if (checkType.includes('Loose Crystals')) {
        return 'loose_crystal';
    } else if (
        checkType.includes('Beedle') &&
        checkType.includes('Shop Purchases')
    ) {
        return 'beedle_shop';
    } else if (checkType.includes('Gear Shop Purchases')) {
        return 'gear_shop';
    } else if (checkType.includes('Potion Shop Purchases')) {
        return 'potion_shop';
    } else if (
        checkType.includes('Tadtones') &&
        !checkName.includes("Water Dragon's Reward")
    ) {
        return 'tadtone';
    } else {
        return 'regular';
    }
}
