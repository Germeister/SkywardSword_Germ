import { createSelector } from '@reduxjs/toolkit';
import { type RootState } from '../store/Store';

export const colorSchemeSelector = (state: RootState) =>
    state.customization.colorScheme;

export const itemLayoutSelector = (state: RootState) =>
    state.customization.itemLayout;

export const locationLayoutSelector = (state: RootState) =>
    state.customization.locationLayout;

export const trickSemiLogicSelector = (state: RootState) =>
    state.customization.trickSemilogic;

export const trickSemiLogicTrickListSelector = createSelector(
    [(state: RootState) => state.customization.enabledTrickLogicTricks],
    (tricks) => new Set(tricks),
);

export const counterBasisSelector = (state: RootState) =>
    state.customization.counterBasis;

export const tumbleweedSelector = (state: RootState) =>
    state.customization.tumbleweed;

export const hasCustomLayoutSelector = (state: RootState) =>
    Boolean(state.customization.customLayout);

export const customLayoutSelector = (state: RootState) =>
    state.customization.customLayout!;

export const itemLocationAssignmentEnabledSelector = (state: RootState) =>
    state.customization.itemLocationAssignment;
