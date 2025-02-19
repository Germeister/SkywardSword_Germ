import { compact, pick } from 'es-toolkit';
import goddessCubeImg from '../../assets/sidequests/goddess_cube.png';
import gossipStoneImg from '../../assets/sidequests/gossip_stone.png';
import type { ColorScheme } from '../../customization/ColorScheme';
import images from '../../itemTracker/Images';
import type { CheckGroup, HintRegion } from '../../logic/Locations';
import type { SubmarkerData } from './Marker';

/**
 * Data for a single hint region, or for a province
 * comprising multiple regions on the main map.
 */
export type RegionCounters = Pick<HintRegion, 'checks' | 'extraLocations'>;

export function getRegionData(hintRegion: HintRegion): RegionCounters {
    return pick(hintRegion, ['checks', 'extraLocations']);
}

const initialCounters = (): CheckGroup => ({
    list: [],
    numAccessible: 0,
    numRemaining: 0,
    numTotal: 0,
});

export function initialRegionData(): RegionCounters {
    return {
        checks: initialCounters(),
        extraLocations: {
            gossip_stone: initialCounters(),
            loose_crystal: initialCounters(),
            tr_cube: initialCounters(),
        },
    };
}

export function combineRegionCounters(
    left: RegionCounters,
    right: RegionCounters,
): RegionCounters {
    const combineCounters = (
        left: CheckGroup | undefined,
        right: CheckGroup | undefined,
    ): CheckGroup => {
        if (left === undefined) {
            return right ?? initialCounters();
        } else if (right === undefined) {
            return left;
        }
        return {
            list: [...left.list, ...right.list],
            numAccessible: left.numAccessible + right.numAccessible,
            numRemaining: left.numRemaining + right.numRemaining,
            numTotal: left.numTotal + right.numTotal,
        };
    };
    return {
        checks: combineCounters(left.checks, right.checks),
        extraLocations: {
            tr_cube: combineCounters(
                left.extraLocations.tr_cube,
                right.extraLocations.tr_cube,
            ),
            gossip_stone: combineCounters(
                left.extraLocations.gossip_stone,
                right.extraLocations.gossip_stone,
            ),
            loose_crystal: combineCounters(
                left.extraLocations.loose_crystal,
                right.extraLocations.loose_crystal,
            ),
        },
    };
}

export function getMarkerColor({
    numAccessible,
    numRemaining,
}: CheckGroup): keyof ColorScheme {
    if (numRemaining === 0) {
        return 'checked';
    } else if (numAccessible === numRemaining) {
        return 'inLogic';
    } else if (numAccessible !== 0) {
        return 'semiLogic';
    } else {
        return 'outLogic';
    }
}

function getExtraMarkerColor(group: CheckGroup): keyof ColorScheme | undefined {
    if (group.numRemaining === 0) {
        return undefined;
    } else {
        return getMarkerColor(group);
    }
}

const imageMap = {
    tr_cube: goddessCubeImg,
    gossip_stone: gossipStoneImg,
    loose_crystal: images['Gratitude Crystals Grid'][1],
};

export function getSubmarkerData(counters: RegionCounters): SubmarkerData[] {
    return compact(
        (['tr_cube', 'loose_crystal', 'gossip_stone'] as const).map((group) => {
            if (!counters.extraLocations[group]) {
                return;
            }
            const color = getExtraMarkerColor(counters.extraLocations[group]);
            if (!color) {
                return;
            }
            return {
                key: group,
                image: imageMap[group],
                color,
            };
        }),
    );
}
