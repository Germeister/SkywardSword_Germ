import { produce } from 'immer';
import type { TrackerState } from './tracker/Slice';

export function migrateTrackerState(old: TrackerState): TrackerState {
    return produce(old, (draft) => {
        for (const key of Object.keys(old.hints)) {
            if (old.hints[key] && !Array.isArray(old.hints[key])) {
                draft.hints[key] = [old.hints[key]];
            }
        }
    });
}
