import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { getStoredCustomization } from '../LocalStorage';
import { type ColorScheme, lightColorScheme } from './ColorScheme';

export type ItemLayout = 'grid' | 'inventory';
export type LocationLayout = 'list' | 'map';
export type CounterBasis = 'logic' | 'semilogic';

export interface CustomizationState {
    colorScheme: ColorScheme;
    itemLayout: ItemLayout;
    locationLayout: LocationLayout;
    trickSemilogic: boolean;
    enabledTrickLogicTricks: string[];
    counterBasis: CounterBasis;
    tumbleweed: boolean;
    customLayout: string | undefined;
    itemLocationAssignment: boolean;
}

const initialState: CustomizationState = {
    colorScheme: lightColorScheme,
    itemLayout: 'inventory',
    locationLayout: 'map',
    trickSemilogic: false,
    enabledTrickLogicTricks: [],
    counterBasis: 'logic',
    tumbleweed: false,
    customLayout: undefined,
    itemLocationAssignment: false,
};

export function preloadedCustomizationState(): CustomizationState {
    const loadedState = getStoredCustomization();

    return {
        ...initialState,
        ...loadedState,
        colorScheme: { ...lightColorScheme, ...loadedState.colorScheme },
    };
}

const customizationSlice = createSlice({
    name: 'customization',
    initialState,
    reducers: {
        setColorScheme: (state, action: PayloadAction<ColorScheme>) => {
            state.colorScheme = action.payload;
        },
        setItemLayout: (state, action: PayloadAction<ItemLayout>) => {
            state.itemLayout = action.payload;
        },
        setLocationLayout: (state, action: PayloadAction<LocationLayout>) => {
            state.locationLayout = action.payload;
        },
        setTrickSemiLogic: (state, action: PayloadAction<boolean>) => {
            state.trickSemilogic = action.payload;
        },
        setCounterBasis: (state, action: PayloadAction<CounterBasis>) => {
            state.counterBasis = action.payload;
        },
        setEnabledSemilogicTricks: (state, action: PayloadAction<string[]>) => {
            state.enabledTrickLogicTricks = action.payload;
        },
        setTrackTumbleweed: (state, action: PayloadAction<boolean>) => {
            state.tumbleweed = action.payload;
        },
        setCustomLayout: (state, action: PayloadAction<string | undefined>) => {
            state.customLayout = action.payload;
        },
        setAutoItemAssignment: (state, action: PayloadAction<boolean>) => {
            state.itemLocationAssignment = action.payload;
        },
        resetCustomizationForTest: (_state, _action: PayloadAction<void>) => {
            return initialState;
        },
    },
});

export const {
    setColorScheme,
    setItemLayout,
    setLocationLayout,
    setTrickSemiLogic,
    setCounterBasis,
    setEnabledSemilogicTricks,
    setTrackTumbleweed,
    setCustomLayout,
    setAutoItemAssignment,
    resetCustomizationForTest,
} = customizationSlice.actions;

export default customizationSlice.reducer;
