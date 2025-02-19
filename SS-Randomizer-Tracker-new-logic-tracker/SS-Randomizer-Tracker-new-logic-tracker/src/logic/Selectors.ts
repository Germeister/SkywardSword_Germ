import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store/Store';
import { parseLogic } from './Logic';

const rawLogicSelector = (state: RootState) => state.logic.loaded!.logic;
/** Selects loaded options. Throws if not loaded. */
export const optionsSelector = (state: RootState) =>
    state.logic.loaded!.options;

/** A selector that returns true iff logic is loaded. */
export const isLogicLoadedSelector = (state: RootState) =>
    Boolean(state.logic.loaded);

/** Select parsed logic. Throws if logic hasn't loaded yet (guard with `isLogicLoadedSelector`). */
export const logicSelector = createSelector([rawLogicSelector], parseLogic);

export const areaGraphSelector = createSelector(
    [logicSelector],
    (logic) => logic.areaGraph,
);
