import { useSelector } from 'react-redux';
import Tooltip from './additionalComponents/Tooltip';
import styles from './BasicCounters.module.css';
import { counterBasisSelector } from './customization/Selectors';
import type { ExitMapping, LogicalState } from './logic/Locations';
import {
    exitsSelector,
    getRequirementLogicalStateSelector,
    totalCountersSelector,
} from './tracker/Selectors';

export default function BasicCounters() {
    const state = useSelector(totalCountersSelector);

    const exits = useSelector(exitsSelector);
    const getLogicalState = useSelector(getRequirementLogicalStateSelector);
    const counterBasis = useSelector(counterBasisSelector);
    const shouldCount = (state: LogicalState) =>
        counterBasis === 'logic' ? state === 'inLogic' : state !== 'outLogic';

    const relevantExits = exits.filter(
        (e) =>
            e.canAssign &&
            !e.rule.isKnownIrrelevant &&
            !e.entrance &&
            shouldCount(getLogicalState(e.exit.id)),
    );

    return (
        <div className={styles.counters}>
            <span className={styles.counter}>{state.numChecked}</span>
            <span>Locations Checked</span>
            <span className={styles.counter}>{state.numAccessible}</span>
            <span>Locations Accessible</span>
            <span className={styles.counter}>{state.numRemaining}</span>
            <span>Locations Remaining</span>

            <span className={styles.counter}>{state.numExitsAccessible}</span>
            <Tooltip
                disabled={!relevantExits.length}
                content={<EntrancesTooltip exits={relevantExits} />}
            >
                <span>Entrances Accessible</span>
            </Tooltip>
        </div>
    );
}

function EntrancesTooltip({ exits }: { exits: ExitMapping[] }) {
    return (
        <ul>
            {exits.map((e) => (
                <li key={e.exit.id}>
                    <span className={styles.accessibleEntrance}>
                        {e.exit.name}
                    </span>
                </li>
            ))}
        </ul>
    );
}
