import type { TriggerEvent } from 'react-contexify';
import { useSelector } from 'react-redux';
import leaveEldin from '../../assets/maps/leaveEldin.png';
import leaveFaron from '../../assets/maps/leaveFaron.png';
import leaveLanayru from '../../assets/maps/leaveLanayru.png';
import leaveSkyloft from '../../assets/maps/leaveSkyloft.png';
import { areaGraphSelector } from '../../logic/Selectors';
import keyDownWrapper from '../../utils/KeyDownWrapper';
import EntranceMarker from './EntranceMarker';
import MapMarker from './MapMarker';
import type { MapHintRegion } from './MapModel';

export type ExitParams = {
    image: string;
    width: number;
    left: number;
    top: number;
};

const images: Record<string, string> = {
    leaveSkyloft,
    leaveFaron,
    leaveEldin,
    leaveLanayru,
};

function Submap({
    onSubmapChange,
    onGroupChange,
    onChooseEntrance,
    provinceId,
    title,
    map,
    activeSubmap,
    markers,
    exitParams,
    currentRegionOrExit,
}: {
    title: string;
    provinceId: string;
    onGroupChange: (region: string | undefined) => void;
    onSubmapChange: (submap: string | undefined) => void;
    onChooseEntrance: (exitId: string) => void;
    markers: MapHintRegion[];
    activeSubmap: string | undefined;
    map: string;
    exitParams: ExitParams;
    currentRegionOrExit: string | undefined;
}) {
    const areaGraph = useSelector(areaGraphSelector);

    const handleBack = (e: TriggerEvent | React.UIEvent) => {
        if (e.type === 'contextmenu') {
            e.preventDefault();
            onSubmapChange(undefined);
        } else {
            onSubmapChange(undefined);
        }
    };

    return (
        <div>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <img
                src={map}
                alt={`${title} Map`}
                width="100%"
                style={{ position: 'relative' }}
                onContextMenu={handleBack}
                draggable={false}
            />
            {markers.map((marker) => {
                if (marker.type === 'hint_region') {
                    return (
                        <MapMarker
                            key={marker.hintRegion}
                            markerX={marker.markerX}
                            markerY={marker.markerY}
                            title={marker.hintRegion!}
                            submarkerPlacement={marker.supmarkerPlacement}
                            onGlickGroup={onGroupChange}
                            selected={
                                marker.hintRegion !== undefined &&
                                marker.hintRegion === currentRegionOrExit
                            }
                        />
                    );
                } else {
                    return (
                        <EntranceMarker
                            key={marker.exitId}
                            markerX={marker.markerX}
                            markerY={marker.markerY}
                            title={areaGraph.exits[marker.exitId].short_name}
                            active={provinceId === activeSubmap}
                            exitId={marker.exitId}
                            selected={
                                marker.exitId === currentRegionOrExit ||
                                (marker.hintRegion !== undefined &&
                                    marker.hintRegion === currentRegionOrExit)
                            }
                            submarkerPlacement={marker.supmarkerPlacement}
                            onGlickGroup={onGroupChange}
                            onChooseEntrance={onChooseEntrance}
                        />
                    );
                }
            })}
            <div
                onKeyDown={keyDownWrapper(handleBack)}
                onClick={handleBack}
                onContextMenu={handleBack}
                role="button"
                tabIndex={0}
            >
                <img
                    draggable={false}
                    alt="Back to Sky"
                    src={images[exitParams.image]}
                    width={`${exitParams.width}%`}
                    style={{
                        position: 'absolute',
                        left: `${exitParams.left}%`,
                        top: `${exitParams.top}%`,
                    }}
                />
            </div>
        </div>
    );
}

export default Submap;
