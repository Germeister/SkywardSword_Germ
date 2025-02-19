import type { CSSProperties } from 'react';

import clsx from 'clsx';
import { keyBy } from 'es-toolkit';
import React from 'react';
import { useSelector } from 'react-redux';
import dreadfuse from '../assets/bosses/dreadfuse.png';
import eldinTrialGate from '../assets/bosses/eldinTrialGate.png';
import faronTrialGate from '../assets/bosses/faronTrialGate.png';
import g1 from '../assets/bosses/g1.png';
import g2 from '../assets/bosses/g2.png';
import koloktos from '../assets/bosses/koloktos.png';
import lanayruTrialGate from '../assets/bosses/lanayruTrialGate.png';
import moldarach from '../assets/bosses/moldarach.png';
import scaldera from '../assets/bosses/scaldera.png';
import tentalus from '../assets/bosses/tentalus.png';
import trialGate from '../assets/bosses/trialGate.png';
import dungeonDataOrig from '../data/dungeons.json';
import HintMarker from '../hints/HintMarker';
import AreaCounters from '../locationTracker/AreaCounters';
import {
    type DungeonName as DungeonNameType,
    type HintRegion,
    isDungeon,
} from '../logic/Locations';
import { areasSelector, settingSelector } from '../tracker/Selectors';
import type { InterfaceAction } from '../tracker/TrackerInterfaceReducer';
import styles from './DungeonTracker.module.css';
import Item from './Item';
import DungeonIcon from './items/dungeons/DungeonIcon';
import DungeonName from './items/dungeons/DungeonName';

const silentRealmData: Record<string, string> = {
    'Faron Silent Realm': faronTrialGate,
    'Eldin Silent Realm': eldinTrialGate,
    'Lanayru Silent Realm': lanayruTrialGate,
    'Skyloft Silent Realm': trialGate,
};

const dungeonData = keyBy(dungeonDataOrig, (data) => data.hintRegion);

const dungeonIcons: Record<string, string> = {
    Skyview: g1,
    'Earth Temple': scaldera,
    'Lanayru Mining Facility': moldarach,
    'Ancient Cistern': koloktos,
    Sandship: tentalus,
    'Fire Sanctuary': g2,
    'Sky Keep': dreadfuse,
} satisfies Record<DungeonNameType, string>;

export default function DungeonTracker({
    interfaceDispatch,
    compact,
}: {
    interfaceDispatch: React.Dispatch<InterfaceAction>;
    compact?: boolean;
}) {
    const areas = useSelector(areasSelector);
    const dungeons = areas.filter(
        (a) => isDungeon(a.name) && !a.hidden,
    ) as HintRegion<DungeonNameType>[];
    const silentRealms = areas.filter((a) => a.name.includes('Silent Realm'));

    const hideEtKeyPieces = useSelector(settingSelector('open-et'));

    const colspan2 = (atCol: number): CSSProperties => ({
        gridColumn: `${atCol + 1} / span 2`,
    });

    const setActiveArea = (hintRegion: string) =>
        interfaceDispatch({ type: 'selectHintRegion', hintRegion });

    return (
        <div>
            <div
                className={clsx(styles.dungeons, {
                    [styles.sixDungeons]: dungeons.length === 6,
                    [styles.compact]: compact,
                })}
            >
                {dungeons.map((d, index) => {
                    const isSmallKeyHidden =
                        d.name === 'Earth Temple' && hideEtKeyPieces;
                    return (
                        <React.Fragment key={d.name}>
                            {!isSmallKeyHidden && (
                                <Item
                                    className={styles.keyItem}
                                    itemName={
                                        d.name !== 'Earth Temple'
                                            ? `${d.name} Small Key`
                                            : 'Key Piece'
                                    }
                                />
                            )}
                            <Item
                                style={
                                    isSmallKeyHidden
                                        ? colspan2(index * 2)
                                        : undefined
                                }
                                className={clsx(styles.keyItem, {
                                    [styles.wide]: isSmallKeyHidden,
                                })}
                                itemName={
                                    d.name !== 'Sky Keep'
                                        ? `${d.name} Boss Key`
                                        : 'Stone of Trials'
                                }
                            />
                        </React.Fragment>
                    );
                })}
                {dungeons.map((d, index) => (
                    <div style={colspan2(index * 2)} key={d.name}>
                        <DungeonName
                            setActiveArea={setActiveArea}
                            dungeonAbbr={dungeonData[d.name].abbr}
                            dungeonName={d.name}
                        />
                    </div>
                ))}
                {!compact && (
                    <>
                        {dungeons.map((d, index) => (
                            <div key={d.name} style={colspan2(index * 2)}>
                                <DungeonIcon
                                    area={d.name}
                                    image={
                                        dungeonIcons[
                                            dungeonData[d.name].hintRegion
                                        ]
                                    }
                                    iconLabel={d.name}
                                    groupClicked={() => setActiveArea(d.name)}
                                />
                            </div>
                        ))}
                        {dungeons.map((d, index) => (
                            <div key={d.name} style={colspan2(index * 2)}>
                                <AreaCounters
                                    totalChecksLeftInArea={
                                        d.checks.numRemaining
                                    }
                                    totalChecksAccessible={
                                        d.checks.numAccessible
                                    }
                                />
                            </div>
                        ))}
                    </>
                )}
            </div>
            {!compact && (
                <div className={styles.trials}>
                    {silentRealms.map((a) => (
                        <div
                            className={styles.hintsMarker}
                            key={`hint-${a.name}`}
                        >
                            <HintMarker />
                        </div>
                    ))}
                    {silentRealms.map((a) => (
                        <DungeonIcon
                            key={`icon-${a.name}`}
                            image={silentRealmData[a.name]}
                            iconLabel={a.name}
                            area={a.name}
                            groupClicked={() => setActiveArea(a.name)}
                        />
                    ))}
                    {silentRealms.map((a) => (
                        <AreaCounters
                            key={`counters-${a.name}`}
                            totalChecksLeftInArea={a.checks.numRemaining}
                            totalChecksAccessible={a.checks.numAccessible}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
