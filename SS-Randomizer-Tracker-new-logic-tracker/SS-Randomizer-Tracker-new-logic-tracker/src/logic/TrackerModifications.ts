import { invert } from 'es-toolkit';
import goddessCubesList_ from '../data/goddessCubes2.json';
import type { OptionDefs, TypedOptions } from '../permalink/SettingsTypes';
import type { TrackerState } from '../tracker/Slice';
import { appError } from '../utils/Debug';
import { BitVector } from './bitlogic/BitVector';
import { type InventoryItem, isItem, itemMaxes, itemName } from './Inventory';
import type { DungeonName } from './Locations';
import type { Logic } from './Logic';
import { swordsToAdd } from './ThingsThatWouldBeNiceToHaveInTheDump';

const collectedCubeSuffix = '_TR_Cube_Collected';

export const goddessChestCheckToCubeCheck = Object.fromEntries(
    goddessCubesList_.map(([chest, cube]) => [chest, cube]),
);
export const cubeCheckToGoddessChestCheck = invert<string, string>(
    goddessChestCheckToCubeCheck,
);
export const cubeCollectedToCubeCheck = Object.fromEntries(
    Object.keys(cubeCheckToGoddessChestCheck).map((check) => [
        mapToCubeCollectedRequirement(check),
        check,
    ]),
);
export const cubeCheckToCubeCollected = invert<string, string>(
    cubeCollectedToCubeCheck,
);

function mapToCubeCollectedRequirement(check: string) {
    return `${check}${collectedCubeSuffix}`;
}

// The rando models some items as individual items, but the tracker just has these as stacks.
// Maybe we could ad-hoc rewrite the logic to model these as stacks, but it doesn't seem worth it.
export const sothItems = [
    'Faron Song of the Hero Part',
    'Eldin Song of the Hero Part',
    'Lanayru Song of the Hero Part',
];

export const sothItemReplacement = 'Song of the Hero';

export const triforceItems = [
    'Triforce of Power',
    'Triforce of Wisdom',
    'Triforce of Courage',
];

export const triforceItemReplacement = 'Triforce';

// Checking a dungeon completion check gives the respective "item"
// so that the "All Required Dungeons Complete" requirement is
// logically fulfilled when the player completes the dungeon, not
// when they gain the ability to do so (semilogic...)
export const dungeonCompletionItems: Record<string, string> = {
    Skyview: '\\Tracker\\Skyview Completed',
    'Earth Temple': '\\Tracker\\Earth Temple Completed',
    'Lanayru Mining Facility': '\\Tracker\\Lanayru Mining Facility Completed',
    'Ancient Cistern': '\\Tracker\\Ancient Cistern Completed',
    Sandship: '\\Tracker\\Sandship Completed',
    'Fire Sanctuary': '\\Tracker\\Fire Sanctuary Completed',
    'Sky Keep': '\\Tracker\\Sky Keep Completed',
} satisfies Record<DungeonName, string>;

export function getInitialItems(
    settings: TypedOptions,
): TrackerState['inventory'] {
    const items: TrackerState['inventory'] = {};
    const add = (item: InventoryItem, count: number = 1) => {
        items[item] ??= 0;
        items[item] += count;
    };
    add('Sailcloth');
    if (settings['starting-tablet-count'] === 3) {
        add('Emerald Tablet');
        add('Ruby Tablet');
        add('Amber Tablet');
    }
    add('Gratitude Crystal Pack', settings['starting-crystal-packs'] ?? 0);
    add('Group of Tadtones', settings['starting-tadtones'] ?? 0);
    add('Empty Bottle', settings['starting-bottles'] ?? 0);

    add(
        'Progressive Sword',
        swordsToAdd[settings['starting-sword'] ?? 'Swordless'],
    );
    const startingItems = settings['starting-items'] ?? [];
    for (const item of startingItems) {
        if (item.includes(sothItemReplacement)) {
            add(sothItemReplacement);
        } else if (item.includes(triforceItemReplacement)) {
            add(triforceItemReplacement);
        } else if (
            isItem(item) &&
            (!item.includes('Pouch') || !items['Progressive Pouch'])
        ) {
            add(item);
        }
    }

    return items;
}

/**
 * Returns a BitVector containing all the expressions that should be visible in the tooltips
 * and not recursively expanded (items and various item-like requirements).
 */
export function getTooltipOpaqueBits(
    logic: Logic,
    options: OptionDefs,
    settings: TypedOptions,
    expertMode: boolean,
    consideredTricks: Set<string>,
) {
    const items = new BitVector();
    const set = (id: string) => {
        const bit = logic.itemBits[id];
        if (bit !== undefined) {
            items.setBit(bit);
        } else {
            appError('unknown item', id);
        }
    };

    for (const option of options) {
        if (
            option.type === 'multichoice' &&
            (option.command === 'enabled-tricks-glitched' ||
                option.command === 'enabled-tricks-bitless')
        ) {
            const vals = option.choices;
            for (const opt of vals) {
                const considered =
                    settings[option.command].includes(opt) ||
                    (expertMode &&
                        (!consideredTricks.size || consideredTricks.has(opt)));
                if (considered) {
                    set(`${opt} Trick`);
                }
            }
        }
    }

    // All actual inventory items are shown in the tooltips
    for (const [item, count] of Object.entries(itemMaxes)) {
        if (
            count === undefined ||
            item === 'Sailcloth' ||
            item === 'Tumbleweed'
        ) {
            continue;
        }
        if (item === sothItemReplacement) {
            for (let i = 1; i <= count; i++) {
                set(sothItems[i - 1]);
            }
        } else if (item === triforceItemReplacement) {
            for (let i = 1; i <= count; i++) {
                set(triforceItems[i - 1]);
            }
        } else {
            for (let i = 1; i <= count; i++) {
                set(itemName(item, i));
            }
        }
    }

    // Zelda's Blessing should show the various $Dungeon Completed requirements
    for (const fakeItem of Object.values(dungeonCompletionItems)) {
        set(fakeItem);
    }

    // Goddess chest tooltips should show the corresponding goddess cube.
    for (const cubeItem of Object.values(cubeCheckToCubeCollected)) {
        set(cubeItem);
    }

    // No point in revealing that the math behind 80 crystals is 13*5+15
    for (const amt of [5, 10, 30, 40, 50, 70, 80]) {
        set(`\\${amt} Gratitude Crystals`);
    }

    if (settings['gondo-upgrades'] === false) {
        set(
            "\\Skyloft\\Central Skyloft\\Bazaar\\Gondo's Upgrades\\Upgrade to Quick Beetle",
        );
        set(
            "\\Skyloft\\Central Skyloft\\Bazaar\\Gondo's Upgrades\\Upgrade to Tough Beetle",
        );
    }

    return items;
}
