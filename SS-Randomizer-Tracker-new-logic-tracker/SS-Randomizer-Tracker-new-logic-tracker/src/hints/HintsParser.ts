import dungeonData from '../data/dungeons.json';
import type { SubmarkerData } from '../locationTracker/mapTracker/Marker';
import { itemMaxes } from '../logic/Inventory';
import { dungeonNames, isDungeon } from '../logic/Locations';
import { decodeHint, type Hint } from './Hints';

const barrenSots = /^([a-z0-9\s']+) (barren|dead|sots)$/;
const path = /^([a-z0-9\s']+) -> ([a-z0-9\s']+)\s*(?:\(.*\))?$/;
const itemNames = Object.keys(itemMaxes).map((item) => ({
    original: item,
    lower: item.toLowerCase(),
}));

/**
 * Parse whatever the user entered in the hints text area to a tracker data structure.
 */
export function parseHintsText(
    hintsText: string,
    hintRegionNames: string[],
): { [hintRegion: string]: Hint[] } {
    const result: { [hintRegion: string]: Hint[] } = {};
    if (!hintsText || !$FEATURE_FLAG_HINTS_PARSER) {
        return result;
    }
    const lines = hintsText
        .split('\n')
        .map((part) => part.trim().toLowerCase());
    const hintRegions = hintRegionNames.map((region) => ({
        original: region,
        lower: region.toLowerCase(),
    }));

    const identifyRegion = (userText_: string) => {
        const userText = userText_.trim();
        const region = hintRegions.find(
            (candidate) => userText === candidate.lower,
        );
        if (region) {
            // exact match
            return region.original;
        }
        const dungeon = dungeonData.find(
            (dungeon) =>
                dungeon.abbr.toLowerCase() === userText ||
                dungeon.bossNames.some(
                    (name) => name.toLowerCase() === userText,
                ),
        );
        if (dungeon) {
            // Exact dungeon match, either by abbreviation or boss
            return dungeon.hintRegion;
        }
        const matchingRegionsStart = hintRegions.filter((candidate) =>
            candidate.lower.startsWith(userText),
        );
        if (matchingRegionsStart.length === 1) {
            // Only startsWith match
            return matchingRegionsStart[0].original;
        }

        const matchingRegions = hintRegions.filter((candidate) =>
            candidate.lower.includes(userText),
        );
        if (matchingRegions.length === 1) {
            // Only includes match
            return matchingRegions[0].original;
        }

        return undefined;
    };

    const identifyItem = (userText_: string) => {
        const userText = userText_.trim();
        const exactMatch = itemNames.find((item) => item.lower === userText);
        if (exactMatch) {
            return exactMatch.original;
        }
        const progressivePrefix = 'progressive ';
        const nonProgressiveMatch = itemNames.find((item) =>
            item.lower.startsWith(progressivePrefix)
                ? item.lower.substring(progressivePrefix.length) === userText
                : false,
        );
        if (nonProgressiveMatch) {
            // exact match for non-progressive (allows matching Beetle -> Progressive Beetle
            // without Horned Colossus Beetle interfering)
            return nonProgressiveMatch.original;
        }
        const itemParts = userText.split(' ');
        const matchingItems = itemNames.filter((item) =>
            itemParts.every((part) => item.lower.includes(part)),
        );
        if (matchingItems.length === 1) {
            return matchingItems[0].original;
        }
    };

    for (const line of lines) {
        const barrenSotsMatch = line.match(barrenSots);
        if (barrenSotsMatch) {
            const userRegion = barrenSotsMatch[1];
            const ty = barrenSotsMatch[2];
            const region = identifyRegion(userRegion);
            if (region) {
                (result[region] ??= []).push({
                    type: ty === 'sots' ? 'sots' : 'barren',
                });
            }
            continue;
        }

        const pathMatch = line.match(path);
        if (pathMatch) {
            const from = identifyRegion(pathMatch[1]);
            const to = identifyRegion(pathMatch[2]);
            if (from && to && isDungeon(to)) {
                (result[from] ??= []).push({
                    type: 'path',
                    index: dungeonNames.indexOf(to),
                });
            }
            continue;
        }

        const regionItemKeyword = ' in ';
        const idx = line.indexOf(regionItemKeyword);
        if (idx !== -1) {
            const userItem = line.substring(0, idx);
            const userRegion = line.substring(idx + regionItemKeyword.length);
            const region = identifyRegion(userRegion);
            if (region) {
                const item = identifyItem(userItem);
                if (item) {
                    (result[region] ??= []).push({
                        type: 'item',
                        item,
                    });
                }
            }
            // eslint-disable-next-line sonarjs/no-redundant-jump
            continue;
        }
    }

    return result;
}

export function hintsToSubmarkers(hints: Hint[]): SubmarkerData[] {
    return hints.map((h, idx) => {
        const decoded = decodeHint(h);

        return {
            key: idx.toString(),
            color: 'semiLogic',
            image: decoded.image,
        };
    });
}
