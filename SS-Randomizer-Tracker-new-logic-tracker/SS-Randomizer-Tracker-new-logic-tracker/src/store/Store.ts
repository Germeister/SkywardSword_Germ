import { type ThunkAction, configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import customization, {
    preloadedCustomizationState,
} from '../customization/Slice';
import logic from '../logic/Slice';
import saves, { preloadedSavesState } from '../saves/Slice';
import tracker, { preloadedTrackerState } from '../tracker/Slice';

export function createStore() {
    return configureStore({
        reducer: {
            logic,
            customization,
            tracker,
            saves,
        },
        preloadedState: {
            customization: preloadedCustomizationState(),
            tracker: preloadedTrackerState(),
            saves: preloadedSavesState(),
        },
    });
}

export type Store = ReturnType<typeof createStore>;

export type RootState = ReturnType<Store['getState']>;
export type AppDispatch = Store['dispatch'];
export type AppAction = Parameters<AppDispatch>[0];
export const useAppDispatch: () => AppDispatch = useDispatch;
export type SyncThunkResult<R = void> = ThunkAction<
    R,
    RootState,
    undefined,
    Parameters<AppDispatch>[0]
>;
export type ThunkResult<R = void> = ThunkAction<
    R | Promise<R>,
    RootState,
    undefined,
    Parameters<AppDispatch>[0]
>;
