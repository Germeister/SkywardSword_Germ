import { useSelector } from 'react-redux';
import type { ColorScheme } from '../../customization/ColorScheme';
import { exitsByIdSelector, settingSelector } from '../../tracker/Selectors';
import { Marker } from './Marker';

function StartingEntranceMarker({
    onClick,
    selected,
}: {
    onClick: (exitId: string) => void;
    selected: boolean;
}) {
    const startingEntranceRando =
        useSelector(settingSelector('random-start-entrance')) !== 'Vanilla';
    const startMapping = useSelector(exitsByIdSelector)['\\Start'];

    if (!startingEntranceRando) {
        return null;
    }

    const hasSelectedEntrance = Boolean(startMapping.entrance);

    const markerColor: keyof ColorScheme = hasSelectedEntrance
        ? 'checked'
        : 'inLogic';

    const tooltip = (
        <center>
            <div>Starting Entrance</div>
            <div>
                ↳
                {startMapping.entrance
                    ? startMapping.entrance.name
                    : 'Click to choose starting entrance'}
            </div>
        </center>
    );

    return (
        <>
            <Marker
                x={40}
                y={85}
                variant="square"
                color={markerColor}
                tooltip={tooltip}
                onClick={() => onClick(startMapping.exit.id)}
                onContextMenu={() => onClick(startMapping.exit.id)}
                selected={selected}
            >
                {!hasSelectedEntrance && '?'}
            </Marker>
        </>
    );
}

export default StartingEntranceMarker;
