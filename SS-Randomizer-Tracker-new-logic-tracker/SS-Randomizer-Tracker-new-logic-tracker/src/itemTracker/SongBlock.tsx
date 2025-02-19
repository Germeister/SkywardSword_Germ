import type { CSSProperties } from 'react';
import songBlock from '../assets/Song_Block.png';

import Item from './Item';

export default function SongBlock({ width: width }: { width: number }) {
    const sailclothStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 2.01,
        left: width / 13.5,
    };

    const earringsStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 4.05,
        left: width / 1.75,
    };

    const scaleStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 3.9,
        left: width / 4,
    };

    const mittsStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 1.98,
        left: width / 1.325,
    };

    const courageStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 1.325,
        left: width / 1.54,
    };

    const powerStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 1.805,
        left: width / 1.775,
    };

    const wisdomStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 1.805,
        left: width / 3.375,
    };

    const balladStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 1.325,
        left: width / 4.7,
    };
    const sothStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 1.081,
        left: width / 3.15,
    };

    const harpStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 1.33,
        left: width / 2.52,
    };

    const triforceStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 0.77,
        left: width / 1.85,
    };

    const emeraldTabletStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 0.858,
        left: width / 4.3,
    };

    const rubyTabletStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 0.79,
        left: width / 6.2,
    };

    const amberTabletStyle: CSSProperties = {
        position: 'relative',
        bottom: width / 0.788,
        left: width / 13.9,
    };

    const harpWidth = width / 4.6;
    const botgWidth = width / 7;
    const courageWidth = width / 7;
    const wisdomWidth = width / 7;
    const powerWidth = width / 7;
    const sothWidth = width / 2.62;
    const sailclothWidth = width / 5.2;
    const scaleWidth = width / 5.2;
    const earringsWidth = width / 5.2;
    const mittsWidth = width / 5.2;
    const triforceWidth = width / 2.3;
    const emeraldWidth = width / 5.2;
    const rubyWidth = width / 3.85;
    const amberWidth = width / 5.57;

    return (
        <div>
            <img src={songBlock} alt="" width={width} draggable={false} />

            <div style={sailclothStyle}>
                <Item itemName="Sailcloth" imgWidth={sailclothWidth} />
            </div>
            <div style={earringsStyle}>
                <Item itemName="Fireshield Earrings" imgWidth={earringsWidth} />
            </div>
            <div style={scaleStyle}>
                <Item itemName="Water Dragon's Scale" imgWidth={scaleWidth} />
            </div>
            <div style={mittsStyle}>
                <Item itemName="Progressive Mitts" imgWidth={mittsWidth} />
            </div>
            <div style={courageStyle}>
                <Item itemName="Farore's Courage" imgWidth={courageWidth} />
            </div>
            <div style={powerStyle}>
                <Item itemName="Din's Power" imgWidth={powerWidth} />
            </div>
            <div style={wisdomStyle}>
                <Item itemName="Nayru's Wisdom" imgWidth={wisdomWidth} />
            </div>
            <div style={balladStyle}>
                <Item itemName="Ballad of the Goddess" imgWidth={botgWidth} />
            </div>
            <div style={sothStyle}>
                <Item itemName="Song of the Hero" imgWidth={sothWidth} />
            </div>
            <div style={harpStyle}>
                <Item itemName="Goddess's Harp" imgWidth={harpWidth} />
            </div>

            <div style={triforceStyle}>
                <Item itemName="Triforce" imgWidth={triforceWidth} />
            </div>
            <div style={emeraldTabletStyle}>
                <Item itemName="Emerald Tablet" imgWidth={emeraldWidth} />
            </div>
            <div style={rubyTabletStyle}>
                <Item itemName="Ruby Tablet" imgWidth={rubyWidth} />
            </div>
            <div style={amberTabletStyle}>
                <Item itemName="Amber Tablet" imgWidth={amberWidth} />
            </div>
        </div>
    );
}
