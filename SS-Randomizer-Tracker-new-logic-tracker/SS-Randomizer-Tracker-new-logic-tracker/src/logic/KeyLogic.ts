import { produce } from 'immer';
import type { TypedOptions } from '../permalink/SettingsTypes';
import { type InventoryItem, itemMaxes } from './Inventory';
import { dungeonNames, isRegularDungeon } from './Locations';
import { type Logic, type LogicalCheck, isRegularItemCheck } from './Logic';
import { mapInventory } from './Mappers';
import {
    type Requirements,
    computeLeastFixedPoint,
    mergeRequirements,
} from './bitlogic/BitLogic';
import { BitVector } from './bitlogic/BitVector';

export interface PotentialLocations {
    item: InventoryItem;
    count: number;
    potentialChecks: string[];
}

/**
 * Figures out how many keys you need for each check in a dungeon.
 * This is a bit complex unfortunately :(
 *
 * The way this works is for every dungeon:
 * - Assuming you have all items (including small and boss keys), you can reach all dungeon checks
 * - If the small keys are known to be in the dungeon, then at least one key must be in the first
 *   checks that are reachable with all items but no keys
 * - The next key must be in all checks that are reachable assuming you got the first small key
 * - Repeat until we know which checks you must access to be guaranteed to find X small keys
 * - Then all checks that are reachable with all small keys can contain the boss key, if it's known
 *   to be in the dungeon.
 *
 * The reason this is not universally true is that this is not how keys are restricted in rando:
 * - Rando instead says "all small keys and all boss keys must be in the Dungeon Name\Main area",
 *   which excludes boss checks. But theoretically there could be a future option that allows
 *   small keys behind the boss door. In that case the function would need to be tweaked to
 *   assume you have the boss key too when figuring out small key logic, but this can't be done
 *   right now as it would cause key logic to assume small keys can be behind the boss door.
 *
 * The correct thing to do here when rando logic becomes more complex is:
 * - Find a way to put the placement restrictions in the logic dump
 * - Assume you have the boss key when figuring out small key logic
 * - Use the placement restrictions to know whether there are small keys behind the boss door.
 *
 * Update: This still won't work in the interesting cases. E.g. Ancient Cistern, boss door
 * reachable with 0 small keys, but Chest in Key Locked Room needs 2 keys. Semilogic figures out
 * that the small keys could be behind the boss door, which means that it can't assume that you
 * can open Chest in Key Locked Room, which could contain the boss key, so it can't assume that
 * you can get the small keys.
 * So you just don't get key semilogic and this needs a new form of reasoning.
 */
export function keyData(
    logic: Logic,
    logicModeSetting: TypedOptions['logic-mode'],
    bossKeySetting: TypedOptions['boss-key-mode'],
    smallKeySetting: TypedOptions['small-key-mode'],
    settingsRequirements: Requirements,
    checkRequirements: Requirements,
    isCheckBanned: (checkId: string, check: LogicalCheck) => boolean,
    optimisticLogicBits: BitVector,
): PotentialLocations[] {
    const locations: PotentialLocations[] = [];

    // Make no assumptions for now if logic mode doesn't guarantee item
    // placement follows logic.
    if (logicModeSetting !== 'Normal' && logicModeSetting !== 'BiTless') {
        return locations;
    }

    const regionChecks = (region: string) =>
        logic.checksByHintRegion[region].filter(
            (c) =>
                isRegularItemCheck(logic.checks[c].type) &&
                !isCheckBanned(c, logic.checks[c]),
        );

    // Caves small key
    if (
        smallKeySetting === 'Own Dungeon - Restricted' ||
        smallKeySetting === 'Vanilla'
    ) {
        const cavesChecks = regionChecks('Lanayru Caves');
        const item: InventoryItem = 'Lanayru Caves Small Key';
        locations.push({
            item,
            count: 1,
            potentialChecks:
                smallKeySetting === 'Vanilla'
                    ? cavesChecks.filter(
                          (c) => logic.checks[c].originalItem === item,
                      )
                    : cavesChecks,
        });
    }

    // Now compute our baseline logic state - we have all items, except for small keys and boss keys.
    const fullInventoryNoKeys = produce(
        itemMaxes,
        (draft: Record<string, number>) => {
            for (const dungeon of dungeonNames.filter(isRegularDungeon)) {
                delete draft[`${dungeon} Boss Key` satisfies InventoryItem];
                if (dungeon !== 'Earth Temple') {
                    delete draft[
                        `${dungeon} Small Key` satisfies InventoryItem
                    ];
                }
            }
        },
    );

    // This baseline logic state can be re-used in later computations
    const baselineLogicState = computeLeastFixedPoint(
        'KeyLogic baseline',
        mergeRequirements(
            logic.numRequirements,
            logic.staticRequirements,
            settingsRequirements,
            checkRequirements,
            mapInventory(logic, fullInventoryNoKeys),
        ),
    );

    for (const dungeon of dungeonNames.filter(isRegularDungeon)) {
        const dungeonChecks = regionChecks(dungeon);

        const bossKey = `${dungeon} Boss Key` as const;
        const smallKey =
            dungeon !== 'Earth Temple'
                ? (`${dungeon} Small Key` as const)
                : undefined;

        const checksThatCanContainBossKey =
            bossKeySetting === 'Vanilla'
                ? dungeonChecks.filter(
                      (check) => logic.checks[check].originalItem === bossKey,
                  )
                : bossKeySetting === 'Own Dungeon'
                  ? dungeonChecks
                  : undefined;

        const checksThatCanContainSmallKey = smallKey
            ? smallKeySetting === 'Vanilla'
                ? dungeonChecks.filter(
                      (check) => logic.checks[check].originalItem === smallKey,
                  )
                : smallKeySetting === 'Own Dungeon - Restricted' ||
                    smallKeySetting === 'Lanayru Caves Key Only'
                  ? dungeonChecks
                  : undefined
            : undefined;

        // For every kind of check, check if "optimistically" (with all items, keys, ...) all relevant checks are in logic.
        // If not, we may be missing some entrances and we can't actually do key logic in this dungeon.
        const allChecksPotentiallyReachable = (
            checks: string[] | undefined,
        ): true | undefined =>
            checks?.every((check) =>
                optimisticLogicBits.test(logic.itemBits[check]),
            ) || undefined;

        const canDoBossKeyLogic = allChecksPotentiallyReachable(
            checksThatCanContainBossKey,
        );
        const canDoSmallKeyLogic = allChecksPotentiallyReachable(
            checksThatCanContainSmallKey,
        );

        const inventory = { ...fullInventoryNoKeys };
        let logicState = baselineLogicState;
        if (smallKey && checksThatCanContainSmallKey && canDoSmallKeyLogic) {
            for (let i = 1; i <= itemMaxes[smallKey]; i++) {
                locations.push({
                    item: smallKey,
                    count: i,
                    potentialChecks: checksThatCanContainSmallKey.filter((c) =>
                        logicState.test(logic.itemBits[c]),
                    ),
                });
                inventory[smallKey] = i;
                logicState = computeLeastFixedPoint(
                    'KeyLogic step',
                    mergeRequirements(
                        logic.numRequirements,
                        logic.staticRequirements,
                        settingsRequirements,
                        checkRequirements,
                        mapInventory(logic, inventory),
                    ),
                    logicState,
                );
            }
        }

        // NB this uses the results from small key logic
        // This will need to be changed when taking (rando-sourced)
        // placement restrictions into account, but not before then
        if (checksThatCanContainBossKey && canDoBossKeyLogic) {
            locations.push({
                item: bossKey,
                count: 1,
                potentialChecks: checksThatCanContainBossKey.filter((c) =>
                    logicState.test(logic.itemBits[c]),
                ),
            });
        }
    }

    return locations;
}

/** Predict which keys must be accessible in the dungeon, given logical and tracker state. */
export function getSemiLogicKeys(
    logic: Logic,
    inventory: Record<InventoryItem, number>,
    data: PotentialLocations[],
    inLogicBits: BitVector,
    checkedChecks: Set<string>,
): boolean {
    let changed = false;
    for (const entry of data) {
        if (
            inventory[entry.item] < entry.count &&
            entry.potentialChecks.length &&
            entry.potentialChecks.every(
                (c) =>
                    inLogicBits.test(logic.itemBits[c]) || checkedChecks.has(c),
            )
        ) {
            inventory[entry.item] = entry.count;
            changed = true;
        }
    }
    return changed;
}
