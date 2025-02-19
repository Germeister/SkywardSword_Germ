import Location from './Location';
import LocationGrid from './LocationGrid';

export default function LocationGroup({
    wide,
    locations,
    onChooseEntrance,
}: {
    wide: boolean;
    /* the list of locations this group contains */
    locations: string[];
    onChooseEntrance: (exitId: string) => void;
}) {
    return (
        <LocationGrid wide={wide}>
            {locations.map((l) => (
                <Location key={l} onChooseEntrance={onChooseEntrance} id={l} />
            ))}
        </LocationGrid>
    );
}
