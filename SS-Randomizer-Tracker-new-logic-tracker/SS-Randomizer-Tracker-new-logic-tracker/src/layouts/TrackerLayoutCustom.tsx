import type React from 'react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BasicCounters from '../BasicCounters';
import { customLayoutSelector } from '../customization/Selectors';
import { setCustomLayout } from '../customization/Slice';
import { HintsTracker } from '../hints/HintsTracker';
import DungeonTracker from '../itemTracker/DungeonTracker';
import GridTracker from '../itemTracker/GridTracker';
import ItemTracker from '../itemTracker/ItemTracker';
import { LocationGroupList } from '../locationTracker/LocationGroupList';
import { LocationsEntrancesList } from '../locationTracker/LocationsEntrancesList';
import WorldMap from '../locationTracker/mapTracker/WorldMap';
import type {
    InterfaceAction,
    InterfaceState,
} from '../tracker/TrackerInterfaceReducer';
import { convertError } from '../utils/Errors';

/*
Example custom layout JSON (for a Full HD vertical screen):
{
  "components": [
    {
      "id": "dungeonTracker",
      "layout": { "y": 10, "x": 30, "width": 500 },
      "params": { "compact": false }
    },
    { "id": "regionMap", "layout": { "y": 10, "x": 550, "width": 500 } },
    {
      "id": "locationsEntrances",
      "layout": { "y": 300, "x": 550, "width": 500, "height": 350 },
      "params": { "includeHeader": true, "wide": true }
    },
    { "id": "gridInventory", "layout": { "y": 380, "x": 30, "width": 500 } },
    { "id": "counters", "layout": { "y": 700, "x": 550, "width": 500 } },
    {
      "id": "hints",
      "layout": { "y": 850, "x": 550, "width": 500, "height": 300 }
    },
    { "id": "ingameInventory", "layout": { "y": 850, "x": 30, "width": 500 } },
    {
      "id": "regionList",
      "layout": { "y": 1150, "x": 550, "width": 500, "height": 600 }
    }
  ]
}
*/

interface TrackerComponentLayout {
    x: number;
    y: number;
    width: number;
    height?: number;
}

type TrackerComponent = (interaction: {
    interfaceState: InterfaceState;
    interfaceDispatch: React.Dispatch<InterfaceAction>;
}) => React.ReactNode;

type TrackerComponentFactory = (
    layout: TrackerComponentLayout,
    params?: Record<string, string | number | boolean | undefined>,
) => TrackerComponent;

const components: Record<string, TrackerComponentFactory> = {
    gridInventory: (layout, _params) => () => (
        <GridTracker width={layout.width} />
    ),
    ingameInventory: (layout, _params) => () => (
        <ItemTracker width={layout.width} />
    ),
    regionList: () => (interaction) => (
        <div
            style={{ width: '100%', height: '100%', overflow: 'visible auto' }}
        >
            <LocationGroupList
                interfaceState={interaction.interfaceState}
                interfaceDispatch={interaction.interfaceDispatch}
            />
        </div>
    ),
    regionMap: (layout) => (interaction) => (
        <WorldMap
            interfaceDispatch={interaction.interfaceDispatch}
            interfaceState={interaction.interfaceState}
            width={layout.width}
        />
    ),
    locationsEntrances: (_layout, params) => (interaction) => (
        <LocationsEntrancesList
            wide={Boolean(params?.['wide'])}
            includeHeader={Boolean(params?.['includeHeader'])}
            interfaceDispatch={interaction.interfaceDispatch}
            interfaceState={interaction.interfaceState}
        />
    ),
    dungeonTracker: (_layout, params) => (interaction) => (
        <DungeonTracker
            interfaceDispatch={interaction.interfaceDispatch}
            compact={Boolean(params?.['compact'])}
        />
    ),
    counters: () => () => <BasicCounters />,
    hints: () => () => <HintsTracker />,
};

interface TrackerComponentDescription {
    id: string;
    layout: TrackerComponentLayout;
    params: Record<string, string | number | boolean | undefined>;
}

interface CustomLayout {
    components: TrackerComponentDescription[];
}

function check(arg: boolean, msg: string) {
    if (!arg) {
        throw new Error(`invalid custom layout: ${msg}`);
    }
}

// Not a component!
function parseLayout(layout: string): TrackerComponent[] {
    const data = JSON.parse(layout) as CustomLayout;
    check(
        data && typeof data === 'object',
        'custom layout must be a JSON object',
    );
    check(
        Array.isArray(data.components),
        'custom layout must have `components` array',
    );

    const ret: TrackerComponent[] = [];
    let key = 0;
    for (const component of data.components) {
        check(
            'id' in component && typeof component.id === 'string',
            'layout component must have an `id` of type string',
        );
        const def = components[component.id];
        if (!def) {
            throw new Error(`Unknown component ${component.id}`);
        }
        check(
            'layout' in component && typeof component.layout === 'object',
            'layout component must have a `layout` object',
        );
        check(
            typeof component.layout.x === 'number' &&
                typeof component.layout.y === 'number' &&
                typeof component.layout.width === 'number',
            '`layout` object must have `x`, `y` and `width` of type `number`',
        );
        check(
            component.layout.height === undefined ||
                component.layout.height === null ||
                typeof component.layout.height === 'number',
            "`layout` object's `height` must be a number if present",
        );
        check(
            component.params === undefined ||
                component.params === null ||
                typeof component.params === 'object',
            "component object's `params` must be an object, if present",
        );
        const factory = def(component.layout, component.params);
        const myKey = key;
        ret.push((interaction) => {
            return (
                <div
                    key={myKey}
                    style={{
                        position: 'absolute',
                        top: component.layout.y,
                        left: component.layout.x,
                        width: component.layout.width,
                        height: component.layout.height,
                    }}
                >
                    {factory(interaction)}
                </div>
            );
        });
        key++;
    }

    return ret;
}

export function TrackerLayoutCustom({
    interfaceState,
    interfaceDispatch,
}: {
    interfaceState: InterfaceState;
    interfaceDispatch: React.Dispatch<InterfaceAction>;
}) {
    const dispatch = useDispatch();
    const customLayout = useSelector(customLayoutSelector);
    const parseResult = useMemo(() => {
        try {
            return parseLayout(customLayout);
        } catch (e) {
            return convertError(e);
        }
    }, [customLayout]);

    if (typeof parseResult === 'string') {
        return (
            <div>
                <pre style={{ color: 'red' }}>{parseResult}</pre>
                <button
                    type="button"
                    className="tracker-button"
                    onClick={() => {
                        dispatch(setCustomLayout(undefined));
                    }}
                >
                    Remove Custom Layout
                </button>
            </div>
        );
    }

    return (
        <>
            {parseResult.map((component) =>
                component({ interfaceDispatch, interfaceState }),
            )}
        </>
    );
}
