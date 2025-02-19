import { useCallback } from 'react';
import type { TriggerEvent } from 'react-contexify';
import { useSelector } from 'react-redux';
import { decodeHint } from '../hints/Hints';
import { areaGraphSelector } from '../logic/Selectors';
import type { RootState } from '../store/Store';
import {
    areaHintSelector,
    areasSelector,
    checkSelector,
    exitsByIdSelector,
    settingSelector,
} from '../tracker/Selectors';
import HintDescription from './HintsDescription';
import type { MapHintRegion } from './mapTracker/MapModel';
import {
    combineRegionCounters,
    getMarkerColor,
    getRegionData,
    getSubmarkerData,
    initialRegionData,
} from './mapTracker/MapUtils';
import { Marker } from './mapTracker/Marker';

function SubmapHint({ area }: { area: string }) {
    const hints = useSelector(areaHintSelector(area));
    return hints.map((hint, idx) => (
        <HintDescription key={idx} hint={decodeHint(hint)} area={area} />
    ));
}

export function SubmapMarker({
    onSubmapChange,
    onChooseEntrance,
    provinceId,
    title,
    markerX,
    markerY,
    markers,
    currentRegionOrExit,
}: {
    markerX: number;
    markerY: number;
    title: string;
    provinceId: string;
    onSubmapChange: (submap: string | undefined) => void;
    onChooseEntrance: (exitId: string) => void;
    markers: MapHintRegion[];
    currentRegionOrExit: string | undefined;
}) {
    const areas = useSelector(areasSelector);
    const exits = useSelector(exitsByIdSelector);
    let data = initialRegionData();
    for (const marker of markers) {
        const area = areas.find((area) => area.name === marker.hintRegion);
        if (area) {
            data = combineRegionCounters(data, getRegionData(area));
        }
    }

    const areaGraph = useSelector(areaGraphSelector);

    let markerColor = getMarkerColor(data.checks);

    const birdSanityOn = useSelector(settingSelector('random-start-statues'));
    const birdStatueSanityPool =
        birdSanityOn && areaGraph.birdStatueSanity[title];
    const needsBirdStatueSanityExit =
        birdStatueSanityPool &&
        exits[birdStatueSanityPool.exit].entrance === undefined;
    const exitCheck = useSelector(
        (state: RootState) =>
            needsBirdStatueSanityExit &&
            checkSelector(birdStatueSanityPool.exit)(state),
    );

    if (
        exitCheck &&
        exitCheck.logicalState !== 'outLogic' &&
        data.checks.numAccessible === 0
    ) {
        markerColor = exitCheck.logicalState;
    }

    const tooltip = (
        <center>
            <div>
                {title} ({data.checks.numAccessible}/{data.checks.numRemaining})
            </div>
            <div>Click to Expand</div>
            {birdStatueSanityPool && (
                <div>
                    {exits[birdStatueSanityPool.exit].entrance
                        ? `↳${exits[birdStatueSanityPool.exit].entrance!.name}`
                        : '↳Right-click to choose Starting Statue'}
                </div>
            )}
            {markers.map((marker, idx) =>
                marker.hintRegion ? (
                    <SubmapHint key={idx} area={marker.hintRegion} />
                ) : undefined,
            )}
        </center>
    );

    const handleClick = (e: TriggerEvent | React.UIEvent) => {
        if (e.type === 'contextmenu') {
            e.preventDefault();
        } else {
            onSubmapChange(provinceId);
        }
    };

    const birdStatueExitId = birdStatueSanityPool && birdStatueSanityPool.exit;

    const displayMenu = useCallback(
        (e: React.UIEvent) => {
            if (birdStatueExitId) {
                onChooseEntrance(birdStatueExitId);
            }
            e.preventDefault();
        },
        [birdStatueExitId, onChooseEntrance],
    );

    return (
        <Marker
            x={markerX}
            y={markerY}
            variant={title.includes('Silent Realm') ? 'circle' : 'rounded'}
            color={markerColor}
            tooltip={tooltip}
            onClick={handleClick}
            onContextMenu={displayMenu}
            selected={currentRegionOrExit === birdStatueExitId}
            submarkerPlacement="right"
            submarkers={getSubmarkerData(data)}
        >
            {data.checks.numAccessible > 0
                ? data.checks.numAccessible
                : needsBirdStatueSanityExit
                  ? '?'
                  : ''}
        </Marker>
    );
}
