import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { RemoteReference } from '../loader/LogicLoader';
import { getStoredSaves } from '../LocalStorage';
import type { AllTypedOptions } from '../permalink/SettingsTypes';

export interface Preset {
    id: string;
    name: string;
    remote: Exclude<RemoteReference, { type: 'latestRelease' }>;
    settings: AllTypedOptions;
    /**
     * A display-only permalink. The source of truth in a preset are the
     * remote+settings combination, this is just displayed in the presets
     * list.
     */
    visualPermalink: string;
}

export interface SavesState {
    presets: Preset[];
    // TODO: Actual save states
}

const initialState: SavesState = {
    presets: [],
};

export function preloadedSavesState(): SavesState {
    const loadedState = getStoredSaves();

    return {
        ...initialState,
        ...loadedState,
    };
}

const savesSlice = createSlice({
    name: 'saves',
    initialState,
    reducers: {
        addPreset: (state, action: PayloadAction<Omit<Preset, 'id'>>) => {
            state.presets.push({ id: uuidv4(), ...action.payload });
        },
        removePreset: (state, action: PayloadAction<string>) => {
            state.presets = state.presets.filter(
                (p) => p.id !== action.payload,
            );
        },
    },
});

export const { addPreset, removePreset } = savesSlice.actions;

export default savesSlice.reducer;
