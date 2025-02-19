import React from 'react';
import type { HintRegion } from '../logic/Locations';
import LocationGroup from './LocationGroup';

export function Locations({
    wide,
    hintRegion,
    onChooseEntrance,
}: {
    wide: boolean;
    hintRegion: HintRegion<string>;
    onChooseEntrance: (exitId: string) => void;
}) {
    return (
        <>
            <LocationGroup
                wide={wide}
                onChooseEntrance={onChooseEntrance}
                locations={hintRegion.checks.list}
            />
            {(
                ['loose_crystal', 'tr_cube', 'gossip_stone', 'exits'] as const
            ).map(
                (type) =>
                    Boolean(hintRegion.extraLocations[type]?.list.length) && (
                        <React.Fragment key={type}>
                            <hr />
                            <LocationGroup
                                wide={wide}
                                onChooseEntrance={onChooseEntrance}
                                locations={
                                    hintRegion.extraLocations[type]!.list
                                }
                            />
                        </React.Fragment>
                    ),
            )}
        </>
    );
}
