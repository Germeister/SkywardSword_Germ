import { useSelector } from 'react-redux';
import { isDungeon } from '../logic/Locations';
import { areasSelector } from '../tracker/Selectors';
import type {
    InterfaceAction,
    InterfaceState,
} from '../tracker/TrackerInterfaceReducer';
import LocationGroupHeader from './LocationGroupHeader';

export function LocationGroupList({
    interfaceState,
    interfaceDispatch,
}: {
    interfaceState: InterfaceState;
    interfaceDispatch: React.Dispatch<InterfaceAction>;
}) {
    const areas = useSelector(areasSelector);
    const setActiveArea = (area: string) =>
        interfaceDispatch({ type: 'selectHintRegion', hintRegion: area });

    return (
        <div style={{ padding: '2%', paddingLeft: 20 }}>
            {areas
                .filter(
                    (area) =>
                        !isDungeon(area.name) &&
                        !area.name.includes('Silent Realm') &&
                        !area.nonProgress,
                )
                .map((value) => (
                    <LocationGroupHeader
                        isActive={
                            interfaceState.type === 'viewingChecks' &&
                            interfaceState.hintRegion === value.name
                        }
                        setActiveArea={setActiveArea}
                        key={value.name}
                        area={value}
                    />
                ))}
        </div>
    );
}
