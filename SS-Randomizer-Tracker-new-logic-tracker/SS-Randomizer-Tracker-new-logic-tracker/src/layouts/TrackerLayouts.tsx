import { useRef } from 'react';
import { useSelector } from 'react-redux';
import BasicCounters from '../BasicCounters';
import {
    itemLayoutSelector,
    locationLayoutSelector,
} from '../customization/Selectors';
import { HintsTracker } from '../hints/HintsTracker';
import DungeonTracker from '../itemTracker/DungeonTracker';
import GridTracker, {
    GRID_TRACKER_ASPECT_RATIO,
} from '../itemTracker/GridTracker';
import ItemTracker, {
    ITEM_TRACKER_ASPECT_RATIO,
} from '../itemTracker/ItemTracker';
import { ItemTrackerContainer } from '../itemTracker/ItemTrackerContainer';
import { LocationGroupList } from '../locationTracker/LocationGroupList';
import { LocationsEntrancesList } from '../locationTracker/LocationsEntrancesList';
import WorldMap, {
    WORLD_MAP_ASPECT_RATIO,
} from '../locationTracker/mapTracker/WorldMap';
import type {
    InterfaceAction,
    InterfaceState,
} from '../tracker/TrackerInterfaceReducer';
import { useElementSize } from '../utils/React';

export function TrackerLayout({
    interfaceState,
    interfaceDispatch,
}: {
    interfaceState: InterfaceState;
    interfaceDispatch: React.Dispatch<InterfaceAction>;
}) {
    const itemLayout = useSelector(itemLayoutSelector);
    const locationLayout = useSelector(locationLayoutSelector);

    // Warning: Layout horrors below.
    // This main tracker area used to be implemented with react-bootstrap's
    // Row and Col types while importing bootstrap v4 AND bootstrap v5 CSS
    // at the same time, and then there was some manual adjustment and
    // styling to get things to behave. So there's a bit of a chicken-and-egg
    // problem where much of the calculations and widths rely on the bootstrap
    // styles, both in this component and the subcomponents. bootstrap has been
    // removed from everything in <Tracker> and below, but we need some of the existing
    // styles so that e.g. the item tracker width calculations match up and I don't
    // want to revamp the main layout yet until more components behave predictably
    // and use modern CSS solutions with fewer manual calculations.

    let itemTracker;
    if (itemLayout === 'inventory') {
        itemTracker = (
            <ItemTrackerContainer
                aspectRatio={ITEM_TRACKER_ASPECT_RATIO}
                itemTracker={(width) => <ItemTracker width={width} />}
            />
        );
    } else if (itemLayout === 'grid') {
        itemTracker = (
            <ItemTrackerContainer
                aspectRatio={GRID_TRACKER_ASPECT_RATIO}
                itemTracker={(width) => <GridTracker width={width} />}
            />
        );
    }

    if (locationLayout === 'list') {
        return (
            <>
                <div style={{ flex: '0 0 auto', width: '33.333%' }}>
                    <div
                        style={{
                            padding: '0.75rem',
                            height: '100%',
                            width: '100%',
                        }}
                    >
                        {itemTracker}
                    </div>
                </div>
                <div style={{ flex: '0 0 auto', width: '33.333%' }}>
                    <div
                        style={{
                            padding: '0 0.75rem',
                            display: 'flex',
                            flexFlow: 'column nowrap',
                            height: '100%',
                        }}
                    >
                        <div
                            style={{
                                flex: '1 1 0',
                                minHeight: 0,
                                overflow: 'visible auto',
                            }}
                        >
                            <LocationGroupList
                                interfaceState={interfaceState}
                                interfaceDispatch={interfaceDispatch}
                            />
                        </div>
                        <div style={{ flex: '1 1 0', minHeight: 0 }}>
                            <LocationsEntrancesList
                                wide={false}
                                interfaceState={interfaceState}
                                interfaceDispatch={interfaceDispatch}
                            />
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        flex: '0 0 auto',
                        height: '100%',
                        width: '33.333%',
                    }}
                >
                    <div
                        style={{
                            padding: '0 0.75rem 2% 0.75rem',
                            display: 'flex',
                            height: '100%',
                            flexFlow: 'column nowrap',
                            gap: '2%',
                        }}
                    >
                        <BasicCounters />
                        <DungeonTracker interfaceDispatch={interfaceDispatch} />
                        <div style={{ flex: '1', maxHeight: 450 }}>
                            <HintsTracker />
                        </div>
                    </div>
                </div>
            </>
        );
    } else {
        return (
            <>
                <div style={{ flex: '0 0 auto', width: '33.333%' }}>
                    <div
                        style={{
                            padding: '0 0.75rem 0.75rem 0.75rem',
                            display: 'flex',
                            flexFlow: 'column',
                            height: '100%',
                            width: '100%',
                            gap: '10px',
                        }}
                    >
                        <DungeonTracker
                            interfaceDispatch={interfaceDispatch}
                            compact
                        />
                        {itemTracker}
                    </div>
                </div>
                <div style={{ flex: '0 0 auto', width: '50%' }}>
                    <div
                        style={{
                            padding: '0 0.75rem',
                            height: '100%',
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        <MapLayoutCenterColumnContainer
                            interfaceDispatch={interfaceDispatch}
                            interfaceState={interfaceState}
                        />
                    </div>
                </div>
                <div
                    style={{
                        flex: '0 0 auto',
                        height: '100%',
                        width: '16.666667%',
                    }}
                >
                    <div
                        style={{
                            padding: '0 0.75rem',
                            display: 'flex',
                            height: '100%',
                            flexFlow: 'column nowrap',
                            gap: '20px',
                        }}
                    >
                        <BasicCounters />
                        <div style={{ height: '100%', maxHeight: 450 }}>
                            <HintsTracker />
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

/**
 * The center column of the map tracker layout has some fun dynamic sizing going on.
 * The world map will expand to fill the available horizontal space, but will never
 * take up more than 55% of the available vertical space.
 */
function MapLayoutCenterColumnContainer({
    interfaceState,
    interfaceDispatch,
}: {
    interfaceState: InterfaceState;
    interfaceDispatch: React.Dispatch<InterfaceAction>;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const { measuredWidth, measuredHeight } = useElementSize(ref);

    const mapWidth = Math.min(
        measuredWidth,
        measuredHeight * 0.55 * WORLD_MAP_ASPECT_RATIO,
    );
    const mapHeight = mapWidth / WORLD_MAP_ASPECT_RATIO;
    const contentHeight = Math.min(measuredHeight, mapHeight * 4);
    return (
        <div style={{ width: '100%', height: '100%' }} ref={ref}>
            {/* placed absolutely in here so that we don't end up influencing our measurement */}
            <div
                style={{
                    position: 'absolute',
                    width: mapWidth,
                    height: contentHeight,
                    display: 'flex',
                    flexFlow: 'column nowrap',
                    gap: '10px',
                }}
            >
                <div
                    style={{
                        flex: `0 0 ${mapHeight}px`,
                    }}
                >
                    <WorldMap
                        width={mapWidth}
                        interfaceState={interfaceState}
                        interfaceDispatch={interfaceDispatch}
                    />
                </div>
                <div style={{ position: 'relative', flex: '1', minHeight: 0 }}>
                    <LocationsEntrancesList
                        wide
                        includeHeader
                        interfaceState={interfaceState}
                        interfaceDispatch={interfaceDispatch}
                    />
                </div>
            </div>
        </div>
    );
}
