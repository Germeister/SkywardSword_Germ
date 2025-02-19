import { type MouseEvent, useCallback } from 'react';
import type { TriggerEvent } from 'react-contexify';
import { useSelector } from 'react-redux';
import {
    draggableToRegionHint,
    useDroppable,
} from '../../dragAndDrop/DragAndDrop';
import { decodeHint } from '../../hints/Hints';
import { hintsToSubmarkers } from '../../hints/HintsParser';
import type { RootState } from '../../store/Store';
import { areaHintSelector, areasSelector } from '../../tracker/Selectors';
import HintDescription from '../HintsDescription';
import type { LocationGroupContextMenuProps } from '../LocationGroupContextMenu';
import { useContextMenu } from '../context-menu';
import { getMarkerColor, getRegionData, getSubmarkerData } from './MapUtils';
import { Marker } from './Marker';

function MapMarker({
    onGlickGroup,
    title,
    markerX,
    markerY,
    submarkerPlacement,
    selected,
}: {
    markerX: number;
    markerY: number;
    submarkerPlacement: 'left' | 'right';
    title: string;
    onGlickGroup: (region: string) => void;
    selected: boolean;
}) {
    const area = useSelector((state: RootState) =>
        areasSelector(state).find((a) => a.name === title),
    )!;
    const data = getRegionData(area);
    const markerColor = getMarkerColor(data.checks);

    const { show } = useContextMenu<LocationGroupContextMenuProps>({
        id: 'group-context',
    });

    const displayMenu = useCallback(
        (e: MouseEvent) => {
            show({ event: e, props: { area: area.name } });
        },
        [area, show],
    );

    let hints = useSelector(areaHintSelector(title));

    const { setNodeRef, active, isOver } = useDroppable({
        type: 'hintRegion',
        hintRegion: area.name,
    });

    const dragPreviewHint = active && draggableToRegionHint(active);
    if (dragPreviewHint && isOver) {
        hints = [...hints, dragPreviewHint];
    }

    const tooltip = (
        <center>
            <div>
                {title} ({data.checks.numAccessible}/{data.checks.numRemaining})
            </div>
            {hints.map((hint, idx) => (
                <HintDescription key={idx} hint={decodeHint(hint)} />
            ))}
        </center>
    );

    const handleClick = (e: TriggerEvent) => {
        if (e.type === 'contextmenu') {
            onGlickGroup(title);
            e.preventDefault();
        } else {
            onGlickGroup(title);
        }
    };

    return (
        <Marker
            ref={setNodeRef}
            x={markerX}
            y={markerY}
            variant="rounded"
            color={markerColor}
            tooltip={tooltip}
            onClick={handleClick}
            onContextMenu={displayMenu}
            selected={selected}
            submarkerPlacement={submarkerPlacement}
            previewStyle={
                dragPreviewHint ? (isOver ? 'hover' : 'droppable') : undefined
            }
            submarkers={[
                ...getSubmarkerData(data),
                ...hintsToSubmarkers(hints),
            ]}
        >
            {Boolean(data.checks.numAccessible) && data.checks.numAccessible}
        </Marker>
    );
}

export default MapMarker;
