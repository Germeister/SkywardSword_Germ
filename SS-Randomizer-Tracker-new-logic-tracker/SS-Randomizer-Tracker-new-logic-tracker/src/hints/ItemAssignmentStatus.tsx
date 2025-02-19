import clsx from 'clsx';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/Store';
import { checkHintsSelector, checkSelector } from '../tracker/Selectors';
import { cancelItemAssignment } from '../tracker/Slice';
import styles from './ItemAssignmentStatus.module.css';

export function ItemAssignmentStatus() {
    const lastSelection = useSelector(
        (state: RootState) => state.tracker.lastCheckedLocation,
    );
    const check = useSelector(checkSelector(lastSelection ?? ''));
    const checkHints = useSelector(checkHintsSelector);
    const trackedItem = lastSelection ? checkHints[lastSelection] : undefined;
    const dispatch = useDispatch();
    const cancel = useCallback(
        () => dispatch(cancelItemAssignment()),
        [dispatch],
    );
    return (
        <div className={styles.row}>
            {trackedItem
                ? `Assigned ${trackedItem} to ${check.checkName} - right click item to undo`
                : check
                  ? `Click item to assign to ${check.checkName}`
                  : undefined}
            {!trackedItem && check && <span>/</span>}
            {!trackedItem && check && (
                <button
                    type="button"
                    className={clsx('tracker-button', styles.button)}
                    onClick={cancel}
                >
                    Cancel item selection
                </button>
            )}
        </div>
    );
}
