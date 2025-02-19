import {
    setAutoItemAssignment,
    setCounterBasis,
    setEnabledSemilogicTricks,
    setTrickSemiLogic,
} from './customization/Slice';
import { type InventoryItem, itemMaxes } from './logic/Inventory';
import type { LogicalState } from './logic/Locations';
import type { TypedOptions } from './permalink/SettingsTypes';
import type { AppAction, RootState, SyncThunkResult } from './store/Store';
import { createTestLogic } from './testing/TestingUtils';
import { checkOrUncheckAll, clickCheck } from './tracker/Actions';
import {
    allSettingsSelector,
    areasSelector,
    checkHintSelector,
    checkSelector,
    rawItemCountSelector,
    totalCountersSelector,
} from './tracker/Selectors';
import {
    acceptSettings,
    cancelItemAssignment,
    clickDungeonName,
    clickItem,
    mapEntrance,
    reset,
    setCheckHint,
    setItemCounts,
} from './tracker/Slice';

describe('full logic tests', () => {
    const tester = createTestLogic();

    beforeAll(tester.initialize);
    beforeEach(tester.reset);

    /**
     * Read the value of a selector. The result is not reactive,
     * so for updated state you must read again after dispatching any actions.
     */
    function readSelector<T>(selector: (state: RootState) => T): T {
        return tester.readSelector(selector);
    }

    function dispatch(action: SyncThunkResult | AppAction) {
        return tester.dispatch(action);
    }

    /**
     * Check that a check of the given name *does not* exist in the area (most likely is banned).
     * To protect against typos, you should also verify that the check exists with different settings.
     */
    function expectCheckAbsent(areaName: string, checkName: string) {
        const check = tester.tryFindCheckId(areaName, checkName);
        expect(check).toBeUndefined();
    }

    /** Set a particular settings value. */
    function updateSettings<K extends keyof TypedOptions>(
        option: K,
        value: TypedOptions[K],
    ) {
        const settings = {
            ...readSelector(allSettingsSelector),
            [option]: value,
        };
        dispatch(acceptSettings({ settings }));
    }

    /** Set a particular settings value. */
    function updateSettingsWithReset<K extends keyof TypedOptions>(
        option: K,
        value: TypedOptions[K],
    ) {
        const settings = {
            ...readSelector(allSettingsSelector),
            [option]: value,
        };
        dispatch(reset({ settings }));
    }

    function updateSettingsWithFullInventory() {
        const fullInventory = [];
        for (const [item, count] of Object.entries(itemMaxes)) {
            for (let i = 0; i < count; i++) {
                fullInventory.push({ item: item as InventoryItem, count });
            }
        }
        dispatch(setItemCounts(fullInventory));
    }

    function checkState(checkId: string): LogicalState {
        return readSelector(checkSelector(checkId)).logicalState;
    }

    it('has some checks in logic with default settings', () => {
        const fledgesGiftId = tester.findCheckId(
            'Upper Skyloft',
            "Fledge's Gift",
        );
        expect(checkState(fledgesGiftId)).toBe('inLogic');
    });

    it('supports hint item semilogic', () => {
        const fledgesGiftId = tester.findCheckId(
            'Upper Skyloft',
            "Fledge's Gift",
        );
        const zeldaClosetGift = tester.findCheckId(
            'Upper Skyloft',
            "Zelda's Closet",
        );

        // Zelda's Closet is out of logic because it needs clawshots
        expect(checkState(zeldaClosetGift)).toBe('outLogic');

        // But if Fledge's Gift is hinted to be Clawshots...
        dispatch(setCheckHint({ checkId: fledgesGiftId, hint: 'Clawshots' }));

        // Then Zelda's Closet is semilogic
        expect(checkState(zeldaClosetGift)).toBe('semiLogic');
    });

    it('supports goddess chests and semilogic', () => {
        const chestName =
            'Northeast Island Goddess Chest behind Bombable Rocks';
        const cubeName = 'Goddess Cube at Lanayru Mine Entrance';
        // Goddess chests are excluded by default
        expectCheckAbsent('Sky', chestName);
        expectCheckAbsent('Lanayru Mine', cubeName);

        updateSettings('excluded-locations', []);
        const goddessChest = tester.findCheckId('Sky', chestName);
        const cubeCheck = tester.findCheckId('Lanayru Mine', cubeName);

        expect(checkState(goddessChest)).toBe('outLogic');

        dispatch(clickItem({ item: 'Clawshots', take: false }));
        dispatch(clickItem({ item: 'Amber Tablet', take: false }));

        // Still out of logic since we still needs bombs to access the chest itself,
        // even if we can access the cube
        expect(checkState(goddessChest)).toBe('outLogic');

        // With bombs, it's semilogic
        dispatch(clickItem({ item: 'Bomb Bag', take: false }));
        expect(checkState(goddessChest)).toBe('semiLogic');

        dispatch(clickCheck({ checkId: cubeCheck }));

        // And once we collect the cube, the chest is in logic
        expect(checkState(goddessChest)).toBe('inLogic');
    });

    it('bans goddess chest if cube is in EUD Skyview', () => {
        const chestName = 'Lumpy Pumpkin\\Goddess Chest on the Roof';
        const cubeName = 'Goddess Cube in Skyview Spring';

        updateSettings('excluded-locations', []);
        updateSettings('empty-unrequired-dungeons', true);
        expectCheckAbsent('Sky', chestName);
        expectCheckAbsent('Skyview', cubeName);

        // Either EUD is off
        updateSettings('empty-unrequired-dungeons', false);
        tester.findCheckId('Sky', chestName);
        tester.findCheckId('Skyview', cubeName);

        // Or SV is required
        updateSettings('empty-unrequired-dungeons', true);
        dispatch(clickDungeonName({ dungeonName: 'Skyview' }));
        tester.findCheckId('Sky', chestName);
        tester.findCheckId('Skyview', cubeName);
    });

    it('shows or hides Sky Keep depending on settings', () => {
        const skyKeepHidden = () =>
            readSelector(areasSelector).find((a) => a.name === 'Sky Keep')!
                .hidden;
        expect(skyKeepHidden()).toBe(true);

        updateSettings(
            'randomize-entrances',
            'All Surface Dungeons + Sky Keep',
        );
        expect(skyKeepHidden()).toBe(false);

        updateSettings('randomize-entrances', 'All Surface Dungeons');
        expect(skyKeepHidden()).toBe(true);
        updateSettings('randomize-entrances', 'Required Dungeons Separately');
        expect(skyKeepHidden()).toBe(true);

        updateSettings('triforce-shuffle', 'Sky Keep');
        expect(skyKeepHidden()).toBe(false);
        updateSettings('triforce-shuffle', 'Vanilla');
        expect(skyKeepHidden()).toBe(false);
    });

    it('handles countable items', () => {
        const check = tester.findCheckId(
            'Eldin Volcano',
            'Chest behind Bombable Wall near Volcano Ascent',
        );
        expect(checkState(check)).toBe('outLogic');

        dispatch(clickItem({ item: 'Ruby Tablet', take: false }));
        expect(checkState(check)).toBe('outLogic');
        dispatch(clickItem({ item: 'Progressive Beetle', take: false }));
        expect(checkState(check)).toBe('outLogic');
        dispatch(clickItem({ item: 'Progressive Beetle', take: false }));
        expect(checkState(check)).toBe('inLogic');
    });

    it('does not assign items by default', () => {
        const fledgesGiftId = tester.findCheckId(
            'Upper Skyloft',
            "Fledge's Gift",
        );
        dispatch(clickCheck({ checkId: fledgesGiftId }));
        dispatch(clickItem({ item: 'Ruby Tablet', take: false }));
        const hintedItem = readSelector(checkHintSelector(fledgesGiftId));
        expect(hintedItem).toBeUndefined();
    });

    it('assigns items with the relevant setting', () => {
        dispatch(setAutoItemAssignment(true));
        const fledgesGiftId = tester.findCheckId(
            'Upper Skyloft',
            "Fledge's Gift",
        );
        dispatch(clickCheck({ checkId: fledgesGiftId }));
        dispatch(clickItem({ item: 'Ruby Tablet', take: false }));
        const hintedItem = readSelector(checkHintSelector(fledgesGiftId));
        expect(hintedItem).toBe('Ruby Tablet');
    });

    it('undoes when taking the item', () => {
        dispatch(setAutoItemAssignment(true));
        const fledgesGiftId = tester.findCheckId(
            'Upper Skyloft',
            "Fledge's Gift",
        );
        dispatch(clickCheck({ checkId: fledgesGiftId }));
        dispatch(clickItem({ item: 'Ruby Tablet', take: false }));
        const hintedItem = readSelector(checkHintSelector(fledgesGiftId));
        expect(hintedItem).toBe('Ruby Tablet');
        dispatch(clickItem({ item: 'Ruby Tablet', take: true }));
        const hintedItemAfterTaking = readSelector(
            checkHintSelector(fledgesGiftId),
        );
        expect(hintedItemAfterTaking).toBeUndefined();
    });

    it('allows correcting the item in an overlapping order', () => {
        dispatch(setAutoItemAssignment(true));
        const fledgesGiftId = tester.findCheckId(
            'Upper Skyloft',
            "Fledge's Gift",
        );
        dispatch(clickCheck({ checkId: fledgesGiftId }));
        dispatch(clickItem({ item: 'Ruby Tablet', take: false }));
        const hintedItem = readSelector(checkHintSelector(fledgesGiftId));
        expect(hintedItem).toBe('Ruby Tablet');
        dispatch(clickItem({ item: 'Emerald Tablet', take: false }));
        const hintedItemAfterGetting = readSelector(
            checkHintSelector(fledgesGiftId),
        );
        expect(hintedItemAfterGetting).toBe('Emerald Tablet');
        dispatch(clickItem({ item: 'Ruby Tablet', take: true }));
        const hintedItemAfterTaking = readSelector(
            checkHintSelector(fledgesGiftId),
        );
        expect(hintedItemAfterTaking).toBe('Emerald Tablet');
    });

    it('does not track gratitude crystals', () => {
        dispatch(setAutoItemAssignment(true));
        const crystalCheckId = tester.findCheckId(
            'Upper Skyloft',
            'Crystal in Knight Academy Plant',
        );
        dispatch(clickCheck({ checkId: crystalCheckId }));
        dispatch(clickItem({ item: 'Ruby Tablet', take: false }));
        const hintedItem = readSelector(checkHintSelector(crystalCheckId));
        expect(hintedItem).toBeUndefined();
    });

    it('cancels tracking when unmarking', () => {
        dispatch(setAutoItemAssignment(true));
        const fledgesGiftId = tester.findCheckId(
            'Upper Skyloft',
            "Fledge's Gift",
        );
        dispatch(clickCheck({ checkId: fledgesGiftId }));
        dispatch(clickCheck({ checkId: fledgesGiftId }));
        dispatch(clickItem({ item: 'Ruby Tablet', take: false }));
        const hintedItem = readSelector(checkHintSelector(fledgesGiftId));
        expect(hintedItem).toBeUndefined();
    });

    it('cancels tracking when cancelling', () => {
        dispatch(setAutoItemAssignment(true));
        const fledgesGiftId = tester.findCheckId(
            'Upper Skyloft',
            "Fledge's Gift",
        );
        dispatch(clickCheck({ checkId: fledgesGiftId }));
        dispatch(cancelItemAssignment());
        dispatch(clickItem({ item: 'Ruby Tablet', take: false }));
        const hintedItem = readSelector(checkHintSelector(fledgesGiftId));
        expect(hintedItem).toBeUndefined();
    });

    it('can bulk mark / unmark', () => {
        dispatch(checkOrUncheckAll('Upper Skyloft', true, true));
        let area = tester.findArea('Upper Skyloft');
        expect(area.checks.numRemaining).toBeLessThan(area.checks.numTotal);
        expect(area.checks.numRemaining).toBeGreaterThan(0);
        dispatch(checkOrUncheckAll('Upper Skyloft', false));
        area = tester.findArea('Upper Skyloft');
        expect(area.checks.numRemaining).toEqual(area.checks.numTotal);
    });

    it('handles semilogic counters', () => {
        const area = tester.findArea("Batreaux's House");
        expect(area.checks.numRemaining).toBeGreaterThan(0);
        expect(area.checks.numAccessible).toBe(0);
        const totalCounter = readSelector(totalCountersSelector).numAccessible;

        dispatch(setCounterBasis('semilogic'));

        const areaWithSemilogic = tester.findArea("Batreaux's House");
        expect(areaWithSemilogic.checks.numRemaining).toBeGreaterThan(0);
        expect(areaWithSemilogic.checks.numAccessible).toBe(2);

        const totalCounterWithSemilogic = readSelector(
            totalCountersSelector,
        ).numAccessible;
        expect(totalCounterWithSemilogic).toBeGreaterThan(totalCounter);
    });

    it('handles starting items', () => {
        expect(
            readSelector(rawItemCountSelector('Progressive Slingshot')),
        ).toBe(0);
        updateSettingsWithReset('starting-items', ['Progressive Slingshot']);

        expect(
            readSelector(rawItemCountSelector('Progressive Slingshot')),
        ).toBe(1);
        expect(readSelector(rawItemCountSelector('Progressive Bow'))).toBe(0);
        updateSettingsWithReset('starting-items', ['Progressive Bow']);
        expect(
            readSelector(rawItemCountSelector('Progressive Slingshot')),
        ).toBe(0);
        expect(readSelector(rawItemCountSelector('Progressive Bow'))).toBe(1);
    });

    it('handles clicking items', () => {
        const click = (take: boolean) =>
            dispatch(clickItem({ item: 'Progressive Bow', take }));
        const count = () =>
            readSelector(rawItemCountSelector('Progressive Bow'));
        expect(count()).toBe(0);
        for (let i = 1; i <= 3; i++) {
            click(false);
            expect(count()).toBe(i);
        }

        // Decrement
        click(true);
        expect(count()).toBe(2);
        click(false);
        // Wrap around
        click(false);
        expect(count()).toBe(0);
        // Wrap around
        click(true);
        expect(count()).toBe(3);
    });

    it('handles trick logic', () => {
        updateSettingsWithReset('starting-items', ['Amber Tablet']);
        const cagedRobotCheck = tester.findCheckId(
            'Lanayru Desert',
            'Rescue Caged Robot',
        );
        expect(checkState(cagedRobotCheck)).toBe('outLogic');

        // You can get this check with Brakeslide and Ampilus Bomb Toss tricks
        dispatch(setTrickSemiLogic(true));
        expect(checkState(cagedRobotCheck)).toBe('trickLogic');

        // Adding a single trick means we no longer consider all tricks by default,
        // so Ampilus Bomb Toss will be missing
        dispatch(setEnabledSemilogicTricks(['Brakeslide']));
        expect(checkState(cagedRobotCheck)).toBe('outLogic');

        // If one trick is in logic and one is customized for tricklogic, still tricklogic
        updateSettings('enabled-tricks-bitless', [
            'Lanayru Desert - Ampilus Bomb Toss',
        ]);
        expect(checkState(cagedRobotCheck)).toBe('trickLogic');

        // Make sure considered tricks are not considered if the toggle is off
        dispatch(setTrickSemiLogic(false));
        expect(checkState(cagedRobotCheck)).toBe('outLogic');

        // If both tricks are in logic, the check is in logic
        updateSettings('enabled-tricks-bitless', [
            'Lanayru Desert - Ampilus Bomb Toss',
            'Brakeslide',
        ]);
        expect(checkState(cagedRobotCheck)).toBe('inLogic');
    });

    it('hides gossip stones with known hint distros', () => {
        updateSettingsWithReset('hint-distribution', 'Balanced');
        tester.findCheckId('Faron Woods', 'Gossip Stone in Deep Woods');

        updateSettingsWithReset('hint-distribution', 'Remlits Tournament');
        expectCheckAbsent('Faron Woods', 'Gossip Stone in Deep Woods');
    });

    it('handles DER = None', () => {
        updateSettingsWithFullInventory();
        updateSettings('randomize-entrances', 'None');
        tester.expectExitAbsent('Faron Woods', 'Exit to Skyview Temple');
        tester.expectExitAbsent('Central Skyloft', 'Exit to Sky Keep');

        // Dungeon requiredness changes nothing
        dispatch(clickDungeonName({ dungeonName: 'Skyview' }));
        tester.expectExitAbsent('Faron Woods', 'Exit to Skyview Temple');
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(0);
    });

    it('handles DER = Required Dungeons Separately', () => {
        updateSettingsWithFullInventory();
        updateSettings('randomize-entrances', 'Required Dungeons Separately');
        updateSettings('empty-unrequired-dungeons', false);
        updateSettings('triforce-required', false);
        updateSettings('triforce-shuffle', 'Anywhere');

        // Unrequired dungeon together with all other unrequired dungeons (including Sky Keep)
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(7);
        expect(
            tester.getExitPool('Central Skyloft', 'Exit to Sky Keep').entrances
                .length,
        ).toBe(7);

        // SV required
        dispatch(clickDungeonName({ dungeonName: 'Skyview' }));
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(1);

        // Eldin together with the unrequired dungeons
        expect(
            tester.getExitPool('Eldin Volcano', 'Exit to Earth Temple')
                .entrances.length,
        ).toBe(6);

        // Make Sky Keep required
        updateSettings('triforce-required', true);
        updateSettings('triforce-shuffle', 'Sky Keep');

        expect(
            tester.getExitPool('Eldin Volcano', 'Exit to Earth Temple')
                .entrances.length,
        ).toBe(5);

        // Skyview required together with Sky Keep
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(2);
        expect(
            tester.getExitPool('Central Skyloft', 'Exit to Sky Keep').entrances
                .length,
        ).toBe(2);

        // ET marked as uninteresting

        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(7);
        updateSettings('empty-unrequired-dungeons', true);
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(2);

        tester.expectRandomExitIrrelevant(
            'Eldin Volcano',
            'Exit to Earth Temple',
        );
    });

    it('handles DER = All Surface Dungeons', () => {
        updateSettingsWithFullInventory();
        updateSettings('randomize-entrances', 'All Surface Dungeons');
        updateSettings('empty-unrequired-dungeons', true);
        updateSettings('triforce-required', false);
        updateSettings('triforce-shuffle', 'Anywhere');

        // Unrequired dungeon together with all other unrequired dungeons (excluding Sky Keep)
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(6);
        tester.expectExitAbsent('Central Skyloft', 'Exit to Sky Keep');

        // SV required
        dispatch(clickDungeonName({ dungeonName: 'Skyview' }));
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(6);

        // Eldin together with the unrequired dungeons
        expect(
            tester.getExitPool('Eldin Volcano', 'Exit to Earth Temple')
                .entrances.length,
        ).toBe(6);

        // Make Sky Keep required
        updateSettings('triforce-required', true);
        updateSettings('triforce-shuffle', 'Sky Keep');

        // Sky Keep still uninteresting
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(6);
        tester.expectExitAbsent('Central Skyloft', 'Exit to Sky Keep');

        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(6);
    });

    it('handles DER = All Surface Dungeons + Sky Keep', () => {
        updateSettingsWithFullInventory();
        updateSettings(
            'randomize-entrances',
            'All Surface Dungeons + Sky Keep',
        );
        updateSettings('empty-unrequired-dungeons', true);
        updateSettings('triforce-required', false);
        updateSettings('triforce-shuffle', 'Anywhere');

        // Unrequired dungeon together with all other unrequired dungeons (including Sky Keep)
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(7);
        expect(
            tester.getExitPool('Central Skyloft', 'Exit to Sky Keep').entrances
                .length,
        ).toBe(7);

        // SV required
        dispatch(clickDungeonName({ dungeonName: 'Skyview' }));
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(7);

        // Eldin together with the other dungeons
        expect(
            tester.getExitPool('Eldin Volcano', 'Exit to Earth Temple')
                .entrances.length,
        ).toBe(7);

        // Make Sky Keep required
        updateSettings('triforce-required', true);
        updateSettings('triforce-shuffle', 'Sky Keep');

        // Sky Keep still unchanged
        expect(
            tester.getExitPool('Faron Woods', 'Exit to Skyview Temple')
                .entrances.length,
        ).toBe(7);
        expect(
            tester.getExitPool('Central Skyloft', 'Exit to Sky Keep').entrances
                .length,
        ).toBe(7);
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(7);
    });

    it('handles num accessible exits correctly', () => {
        updateSettings(
            'randomize-entrances',
            'All Surface Dungeons + Sky Keep',
        );
        updateSettings('random-start-statues', false);

        dispatch(clickItem({ item: 'Stone of Trials', take: false }));
        dispatch(clickItem({ item: 'Clawshots', take: false }));

        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(1);

        dispatch(clickItem({ item: 'Clawshots', take: true }));

        dispatch(clickItem({ item: 'Amber Tablet', take: false }));
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(0);

        dispatch(clickItem({ item: 'Emerald Tablet', take: false }));
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(0);

        updateSettings('random-start-statues', true);
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(2);

        dispatch(
            mapEntrance({
                from: tester.findExit('Sky', 'Faron Pillar\\First Time Dive')
                    .exit.id,
                to: tester.findEntranceId(
                    'Sealed Grounds',
                    'Sealed Grounds Spiral',
                ),
            }),
        );

        expect(
            tester.findExit('Sky', 'Faron Pillar\\First Time Dive').entrance,
        ).toBeTruthy();
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(1);

        dispatch(clickItem({ item: 'Clawshots', take: false }));

        // Lanayru Pillar, Sky Keep, Skyview Temple
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(3);

        dispatch(
            mapEntrance({
                from: tester.findExit('Central Skyloft', 'Exit to Sky Keep')
                    .exit.id,
                to: tester.findEntranceId('Sky Keep', 'Bottom Entrance'),
            }),
        );

        dispatch(
            mapEntrance({
                from: tester.findExit('Faron Woods', 'Exit to Skyview Temple')
                    .exit.id,
                to: tester.findEntranceId('Skyview', 'Main Entrance'),
            }),
        );

        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(1);
    });

    it('handles random starting entrance in accessible exits count', () => {
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(0);

        updateSettings('random-start-entrance', 'Any');
        expect(readSelector(totalCountersSelector).numExitsAccessible).toBe(1);
    });

    it('does not consider banned crystals in semilogic', () => {
        updateSettingsWithReset('starting-crystal-packs', 3);
        dispatch(clickItem({ item: 'Progressive Beetle', take: false }));
        dispatch(clickItem({ item: 'Clawshots', take: false }));

        const bat30Check = tester.findCheckId(
            "Batreaux's House",
            '30 Crystals',
        );
        expect(checkState(bat30Check)).toBe('semiLogic');

        updateSettings('excluded-locations', [
            "Upper Skyloft - Crystal in Link's Room",
        ]);
        expect(checkState(bat30Check)).toBe('outLogic');
    });
});
