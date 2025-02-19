import clsx from 'clsx';
import { useDispatch, useSelector } from 'react-redux';
import { itemLocationAssignmentEnabledSelector } from '../customization/Selectors';
import type { RootState } from '../store/Store';
import { setHintsText } from '../tracker/Slice';
import styles from './HintsTracker.module.css';
import { ItemAssignmentStatus } from './ItemAssignmentStatus';

const hintsPlaceholder = $FEATURE_FLAG_HINTS_PARSER
    ? 'Track hints here! Examples:\nUpper Barren\nFaron -> ET\nFloria -> G2\nTriforce in Boko'
    : 'Track hints here!';

// Just a basic textarea for now
export function HintsTracker() {
    const dispatch = useDispatch();
    const hintsText = useSelector(
        (state: RootState) => state.tracker.userHintsText,
    );
    const autoItemAssignemt = useSelector(
        itemLocationAssignmentEnabledSelector,
    );
    return (
        <div className={styles.hintsTracker}>
            <textarea
                spellCheck={false}
                className={clsx('tracker-input', styles.hintsTextArea)}
                placeholder={hintsPlaceholder}
                value={hintsText}
                onChange={(ev) => dispatch(setHintsText(ev.target.value))}
            />
            {autoItemAssignemt && <ItemAssignmentStatus />}
        </div>
    );
}
