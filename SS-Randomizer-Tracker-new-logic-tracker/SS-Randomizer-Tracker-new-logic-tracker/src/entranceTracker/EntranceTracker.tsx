import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    FixedSizeList as List,
    type ListChildComponentProps,
} from 'react-window';
import { Checkbox } from '../additionalComponents/Checkbox';
import { Dialog } from '../additionalComponents/Dialog';
import { Select, type SelectValue } from '../additionalComponents/Select';
import {
    entrancePoolsSelector,
    exitsSelector,
    usedEntrancesSelector,
} from '../tracker/Selectors';
import { mapEntrance } from '../tracker/Slice';
import { mapValues } from '../utils/Collections';

function EntranceTracker({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const dispatch = useDispatch();
    const exits = useSelector(exitsSelector);
    const usedEntrances = useSelector(usedEntrancesSelector);
    const entrancePools = useSelector(entrancePoolsSelector);

    const [exitSearch, setExitSearch] = useState('');
    const [entranceSearch, setEntranceSearch] = useState('');
    const [clickthrough, setClickthrough] = useState(true);

    const clearFilters = () => {
        setExitSearch('');
        setEntranceSearch('');
    };

    const entranceOptions: Record<string, SelectValue<string>[]> = useMemo(
        () =>
            mapValues(entrancePools, (poolValue, pool) =>
                poolValue.entrances
                    .filter(
                        (entrance) =>
                            !poolValue.usedEntrancesExcluded ||
                            !usedEntrances[pool].includes(entrance.id),
                    )
                    .map(({ id, name }) => ({
                        value: id,
                        payload: id,
                        label: name,
                    })),
            ),
        [entrancePools, usedEntrances],
    );

    const onEntranceChange = (from: string, entrance: string | undefined) => {
        if (!entrance) {
            dispatch(mapEntrance({ from, to: undefined }));
        } else {
            dispatch(mapEntrance({ from, to: entrance }));
        }
    };

    const entranceLower = entranceSearch.toLowerCase();
    const exitLower = exitSearch.toLowerCase();

    const matches = (name: string, searchString: string) => {
        if (!searchString) {
            return true;
        }
        const fragments = searchString.split(' ');
        return fragments.every((fragment) => name.includes(fragment.trim()));
    };

    const filteredRows = exits.filter((e) => {
        return (
            matches(e.exit.name.toLowerCase(), exitLower) &&
            (!entranceSearch ||
                (e.entrance &&
                    matches(e.entrance.name.toLowerCase(), entranceLower)))
        );
    });

    const row = ({ index, style }: ListChildComponentProps) => {
        const exit = filteredRows[index];
        return (
            <div
                key={exit.exit.id}
                style={{
                    ...style,
                    display: 'flex',
                    gap: 4,
                    borderBottom: '1px solid black',
                    alignItems: 'center',
                    padding: '0.5%',
                    filter: !exit.canAssign ? 'opacity(0.5)' : undefined,
                }}
            >
                <div
                    style={{ flex: '1', display: 'flex', alignItems: 'center' }}
                >
                    <span>{exit.exit.name}</span>
                </div>
                <div style={{ flex: '1', minWidth: 0 }}>
                    <Select
                        selectedValue={
                            exit.entrance && {
                                label: exit.entrance.name,
                                payload: exit.entrance.id,
                                value: exit.entrance.id,
                            }
                        }
                        onValueChange={(...args) =>
                            onEntranceChange(exit.exit.id, ...args)
                        }
                        options={
                            exit.canAssign
                                ? entranceOptions[exit.rule.pool]
                                : []
                        }
                        label={exit.exit.name}
                        disabled={!exit.canAssign}
                        searchable
                        clearable
                    />
                </div>
                <div>
                    <button
                        type="button"
                        className="tracker-button"
                        disabled={!exit.entrance}
                        onClick={() =>
                            setExitSearch(
                                exit.entrance?.name.split('-')[0].trim() ?? '',
                            )
                        }
                    >
                        Go to
                    </button>
                </div>
            </div>
        );
    };
    return (
        <Dialog open={open} onOpenChange={onOpenChange} title="Entrances" wide>
            <div style={{ display: 'flex', gap: 4 }}>
                <input
                    className="tracker-input"
                    style={{ flex: '1' }}
                    type="search"
                    placeholder="Search exits"
                    onChange={(e) => setExitSearch(e.target.value)}
                    value={exitSearch}
                />
                <input
                    className="tracker-input"
                    style={{ flex: '1' }}
                    type="search"
                    placeholder="Search entrances"
                    onChange={(e) => setEntranceSearch(e.target.value)}
                    value={entranceSearch}
                />
                <div>
                    <button
                        type="button"
                        className="tracker-button"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    margin: 4,
                }}
            >
                <Checkbox
                    id="clickthrough"
                    checked={clickthrough}
                    onCheckedChange={setClickthrough}
                />
                <label htmlFor="clickthrough">Clickthrough</label>
            </div>
            <List
                itemCount={filteredRows.length}
                height={600}
                width=""
                itemSize={60}
            >
                {row}
            </List>
        </Dialog>
    );
}

export default EntranceTracker;
