import mapData from '../../data/mapData.json';
import type { ExitMapping } from '../../logic/Locations';
import type { AreaGraph } from '../../logic/Logic';

export type MapHintRegion = {
    /**
     * The hint region behind this map node.
     * Uses the bound dungeon/silent realm for exits.
     */
    hintRegion: string | undefined;
    markerX: number;
    markerY: number;
    supmarkerPlacement: 'left' | 'right';
} & (
    | { type: 'hint_region' }
    | {
          type: 'exit';
          exitPool: keyof AreaGraph['linkedEntrancePools'];
          exitId: string;
      }
);

export interface MapProvince {
    provinceId:
        | 'skyloftSubmap'
        | 'faronSubmap'
        | 'eldinSubmap'
        | 'lanayruSubmap';
    name: string;
    regions: MapHintRegion[];
}

/** A resolved map model for the tracker, to simplify common map operations */
export interface MapModel {
    provinces: MapProvince[];
    regions: MapHintRegion[];
}

type MapDataMarker = (typeof mapData)['sky' | 'thunderhead'];

function getMarker(marker: MapDataMarker): MapHintRegion {
    return {
        type: 'hint_region',
        markerX: marker.markerX,
        markerY: marker.markerY,
        hintRegion: marker.region,
        supmarkerPlacement:
            'submarkerPlacement' in marker &&
            marker.submarkerPlacement === 'left'
                ? 'left'
                : 'right',
    };
}

type MapDataEntranceMarker =
    (typeof mapData)['eldinSubmap']['entranceMarkers'][number];

function getEntranceMarker(
    marker: MapDataEntranceMarker,
    areaGraph: AreaGraph,
    exits: Record<string, ExitMapping>,
): MapHintRegion {
    const exitPool = marker.exitPool as keyof AreaGraph['linkedEntrancePools'];
    const exitId =
        areaGraph.linkedEntrancePools[exitPool][marker.entryName].exits[0];
    const mapping = exits[exitId];
    return {
        type: 'exit',
        exitPool,
        exitId,
        markerX: marker.markerX,
        markerY: marker.markerY,
        supmarkerPlacement:
            marker.submarkerPlacement === 'left' ? 'left' : 'right',
        hintRegion: mapping?.entrance?.region,
    };
}

function getProvince(
    provinceId: MapProvince['provinceId'],
    areaGraph: AreaGraph,
    exits: Record<string, ExitMapping>,
): MapProvince {
    const province = mapData[provinceId];
    const getEntrance = (m: MapDataEntranceMarker) =>
        getEntranceMarker(m, areaGraph, exits);
    return {
        provinceId,
        name: province.name,
        regions: [
            ...province.markers.map(getMarker),
            ...province.entranceMarkers.map(getEntrance),
        ],
    };
}

type ProvinceResult =
    | {
          type: 'ok';
          result: string | undefined;
      }
    | {
          type: 'err';
      };

/** For a given hint region, get the owning map view. */
export function getOwningProvince(
    model: MapModel,
    hintRegion: string,
): ProvinceResult {
    for (const region of model.regions) {
        if (region.hintRegion === hintRegion) {
            return { type: 'ok', result: undefined };
        }
    }

    for (const province of model.provinces) {
        for (const region of province.regions) {
            if (region.hintRegion === hintRegion) {
                return { type: 'ok', result: province.provinceId };
            }
        }
    }

    return { type: 'err' };
}

export function getMapModel(
    areaGraph: AreaGraph,
    exits: Record<string, ExitMapping>,
): MapModel {
    return {
        provinces: [
            getProvince('skyloftSubmap', areaGraph, exits),
            getProvince('faronSubmap', areaGraph, exits),
            getProvince('eldinSubmap', areaGraph, exits),
            getProvince('lanayruSubmap', areaGraph, exits),
        ],
        regions: [getMarker(mapData.sky), getMarker(mapData.thunderhead)],
    };
}
