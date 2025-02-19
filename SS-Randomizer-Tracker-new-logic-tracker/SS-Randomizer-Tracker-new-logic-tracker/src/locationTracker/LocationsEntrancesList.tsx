import { useSelector } from 'react-redux';
import { areasSelector } from '../tracker/Selectors';
import type {
    InterfaceAction,
    InterfaceState,
} from '../tracker/TrackerInterfaceReducer';
import EntranceChooser from './EntranceChooser';
import LocationGroupHeader from './LocationGroupHeader';
import { Locations } from './Locations';

export function LocationsEntrancesList({
    includeHeader,
    wide,
    interfaceState,
    interfaceDispatch,
}: {
    includeHeader?: boolean;
    wide: boolean;
    interfaceState: InterfaceState;
    interfaceDispatch: React.Dispatch<InterfaceAction>;
}) {
    const areas = useSelector(areasSelector);
    const activeArea =
        interfaceState.type === 'viewingChecks'
            ? interfaceState.hintRegion
            : undefined;
    const selectedArea =
        (activeArea && areas.find((a) => a.name === activeArea)) || undefined;
    const onChooseEntrance = (exitId: string) =>
        interfaceDispatch({ type: 'chooseEntrance', exitId });

    const setActiveArea = (hintRegion: string) =>
        interfaceDispatch({ type: 'selectHintRegion', hintRegion });

    return (
        <>
            {selectedArea && (
                <div
                    style={{
                        display: 'flex',
                        flexFlow: 'column nowrap',
                        height: '100%',
                    }}
                >
                    {includeHeader && (
                        <div style={{ padding: '2%', width: '100%' }}>
                            <LocationGroupHeader
                                area={selectedArea}
                                setActiveArea={setActiveArea}
                                alignCounters
                            />
                        </div>
                    )}
                    <div style={{ overflow: 'visible auto', flex: '1' }}>
                        <Locations
                            wide={wide}
                            onChooseEntrance={onChooseEntrance}
                            hintRegion={selectedArea}
                        />
                    </div>
                </div>
            )}
            {interfaceState.type === 'choosingEntrance' && (
                <EntranceChooser
                    wide={wide}
                    exitId={interfaceState.exitId}
                    onChoose={(entranceId) =>
                        interfaceDispatch({
                            type: 'cancelChooseEntrance',
                            selectedEntrance: entranceId,
                        })
                    }
                />
            )}
        </>
    );
}
