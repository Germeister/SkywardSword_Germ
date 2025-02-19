import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { RemoteReference } from '../loader/LogicLoader';
import type { OptionDefs } from '../permalink/SettingsTypes';
import type { RawLogic, RawPresets } from './UpstreamTypes';

/**
 * Relevant data loaded from an ssrando upstream.
 */
export interface LogicBundle {
    /** dump.yaml */
    logic: RawLogic;
    /** options.yaml */
    options: OptionDefs;
    /** gui/presets/default_presets.json */
    presets: RawPresets;
    /** the remote we loaded from */
    remote: RemoteReference;
    /** the human-readable data (for Latest version, this is the latest) */
    remoteName: string;
}

export interface LogicState {
    loaded: LogicBundle | undefined;
}

const initialState: LogicState = {
    loaded: undefined,
};

const logicSlice = createSlice({
    name: 'logic',
    initialState,
    reducers: {
        loadLogic: (state, action: PayloadAction<LogicBundle>) => {
            state.loaded = action.payload;
        },
    },
});

export const { loadLogic } = logicSlice.actions;

export default logicSlice.reducer;
