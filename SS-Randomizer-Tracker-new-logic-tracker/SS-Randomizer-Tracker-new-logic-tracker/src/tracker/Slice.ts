import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { getStoredTrackerState } from '../LocalStorage';
import { migrateTrackerState } from '../TrackerStateMigrations';
import type { Hint } from '../hints/Hints';
import { type InventoryItem, isItem, itemMaxes } from '../logic/Inventory';
import type { RegularDungeon } from '../logic/Locations';
import { getInitialItems } from '../logic/TrackerModifications';
import type { AllTypedOptions } from '../permalink/SettingsTypes';

export interface TrackerState {
    /**
     * Checks we've acquired.
     * Includes regular checks and fake checks for cubes/crystals.
     */
    checkedChecks: string[];
    /**
     * Items we've marked as acquired.
     */
    inventory: Partial<Record<InventoryItem, number>>;
    /**
     * Whether this state has been modified.
     */
    hasBeenModified: boolean;
    /**
     * Exits we've has mapped. Later merged with the vanilla connections depending on settings.
     */
    mappedExits: Record<string, string | undefined>;
    /**
     * Dungeons we've marked as required.
     */
    requiredDungeons: string[];
    /**
     * Hints by area
     */
    hints: Record<string, Hint[] | undefined>;
    /**
     * Hints by check name. The referenced item might be an InventoryItem
     * or a dummy item (for various junk items), use `isItem` to check.
     */
    checkHints: Record<string, string | undefined>;
    /**
     * Fully decoded settings.
     */
    settings: Partial<AllTypedOptions>;
    /**
     * A plaintext text area for the user to track hints.
     */
    userHintsText: string;
    /**
     * The last tracked location, for auto item-at-location tracking.
     */
    lastCheckedLocation: string | undefined;
}

const initialState: TrackerState = {
    checkedChecks: [],
    inventory: {},
    hasBeenModified: false,
    mappedExits: {},
    requiredDungeons: [],
    hints: {},
    checkHints: {},
    settings: {},
    userHintsText: '',
    lastCheckedLocation: undefined,
};

export function preloadedTrackerState(): TrackerState {
    return migrateTrackerState({ ...initialState, ...getStoredTrackerState() });
}

const trackerSlice = createSlice({
    name: 'tracker',
    initialState,
    reducers: {
        clickItem: (
            state,
            action: PayloadAction<{ item: InventoryItem; take: boolean }>,
        ) => {
            const { item, take } = action.payload;
            if (!isItem(item)) {
                throw new Error(`bad item ${item as string}`);
            }
            if (item === 'Sailcloth') {
                return;
            }

            const max = itemMaxes[item];
            const count = state.inventory[item] ?? 0;
            let newCount = take ? count - 1 : count + 1;
            if (newCount < 0) {
                newCount += max + 1;
            } else if (newCount > max) {
                newCount -= max + 1;
            }
            state.hasBeenModified = true;
            state.inventory[item] = newCount;

            if (state.lastCheckedLocation) {
                if (newCount > count) {
                    state.checkHints[state.lastCheckedLocation] = item;
                } else if (
                    newCount < count &&
                    state.checkHints[state.lastCheckedLocation] === item
                ) {
                    delete state.checkHints[state.lastCheckedLocation];
                }
            }
        },
        clickCheckInternal: (
            state,
            action: PayloadAction<{
                checkId: string;
                canMarkForItemAssignment: boolean;
                markChecked?: boolean;
            }>,
        ) => {
            const { checkId, canMarkForItemAssignment } = action.payload;
            const add =
                action.payload.markChecked ??
                !state.checkedChecks.includes(checkId);
            if (add) {
                state.checkedChecks.push(checkId);
                if (canMarkForItemAssignment) {
                    state.lastCheckedLocation = checkId;
                }
            } else {
                state.checkedChecks = state.checkedChecks.filter(
                    (c) => c !== checkId,
                );
                if (state.lastCheckedLocation === checkId) {
                    state.lastCheckedLocation = undefined;
                }
            }
            state.hasBeenModified = true;
        },
        setItemCounts: (
            state,
            action: PayloadAction<{ item: InventoryItem; count: number }[]>,
        ) => {
            for (const { item, count } of action.payload) {
                state.inventory[item] = count;
            }
            state.hasBeenModified = true;
        },
        clickDungeonName: (
            state,
            action: PayloadAction<{ dungeonName: RegularDungeon }>,
        ) => {
            const { dungeonName } = action.payload;
            if (state.requiredDungeons.includes(dungeonName)) {
                state.requiredDungeons = state.requiredDungeons.filter(
                    (c) => c !== dungeonName,
                );
            } else {
                state.requiredDungeons.push(dungeonName);
            }
            state.hasBeenModified = true;
        },
        bulkEditChecks: (
            state,
            action: PayloadAction<{ checks: string[]; markChecked: boolean }>,
        ) => {
            const { checks, markChecked } = action.payload;
            const oldChecks = new Set(state.checkedChecks);
            if (markChecked) {
                for (const check of checks) {
                    oldChecks.add(check);
                }
            } else {
                for (const check of checks) {
                    oldChecks.delete(check);
                }
            }
            state.checkedChecks = [...oldChecks];
            state.hasBeenModified = true;
        },
        mapEntrance: (
            state,
            action: PayloadAction<{ from: string; to: string | undefined }>,
        ) => {
            const { from, to } = action.payload;
            state.mappedExits[from] = to;
            state.hasBeenModified = true;
        },
        setHint: (
            state,
            action: PayloadAction<{ areaId: string; hint: Hint | undefined }>,
        ) => {
            const { areaId, hint } = action.payload;
            if (hint === undefined) {
                delete state.hints[areaId];
            } else {
                (state.hints[areaId] ??= []).push(hint);
            }
            state.hasBeenModified = true;
        },
        setCheckHint: (
            state,
            action: PayloadAction<{
                checkId: string;
                hint: string | undefined;
            }>,
        ) => {
            const { checkId, hint } = action.payload;
            state.checkHints[checkId] = hint;
            state.hasBeenModified = true;
        },
        setHintsText: (state, action: PayloadAction<string>) => {
            state.userHintsText = action.payload;
            state.hasBeenModified ||= action.payload !== '';
        },
        cancelItemAssignment: (state) => {
            state.lastCheckedLocation = undefined;
        },
        acceptSettings: (
            state,
            action: PayloadAction<{ settings: AllTypedOptions }>,
        ) => {
            const { settings } = action.payload;
            state.settings = settings;
        },
        reset: (
            _state,
            action: PayloadAction<{ settings: AllTypedOptions }>,
        ) => {
            const { settings } = action.payload;
            return {
                ...initialState,
                settings: settings,
                inventory: getInitialItems(settings),
            };
        },
        loadTracker: (_state, action: PayloadAction<Partial<TrackerState>>) => {
            return migrateTrackerState({ ...initialState, ...action.payload });
        },
    },
});

export const {
    clickItem,
    clickCheckInternal,
    setItemCounts,
    clickDungeonName,
    bulkEditChecks,
    mapEntrance,
    cancelItemAssignment,
    acceptSettings,
    setCheckHint,
    reset,
    setHint,
    setHintsText,
    loadTracker,
} = trackerSlice.actions;

export default trackerSlice.reducer;
