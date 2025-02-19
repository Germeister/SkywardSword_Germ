import { createSelector } from '@reduxjs/toolkit';
import { areaGraphSelector } from '../../logic/Selectors';
import { exitsByIdSelector } from '../../tracker/Selectors';
import { getMapModel } from './MapModel';

export const mapModelSelector = createSelector(
    [areaGraphSelector, exitsByIdSelector],
    getMapModel,
);
