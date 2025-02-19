import type { CSSProperties } from 'react';
import AdditionalItems from './AdditionalItems';
import BWheel from './BWheel';
import styles from './ItemTracker.module.css';
import QuestItems from './QuestItems';
import SongBlock from './SongBlock';
import SwordBlock from './SwordBlock';

export const ITEM_TRACKER_ASPECT_RATIO = 0.585;

const COLUMN_WIDTH_INV = 2.1;
const B_WHEEL_SIZE_INV = 1.27;

export default function ItemTracker({ width }: { width: number }) {
    const swordBlockStyle = {
        position: 'absolute',
        width: width / COLUMN_WIDTH_INV,
    } satisfies CSSProperties;

    const songBlockStyle = {
        position: 'absolute',
        width: width / COLUMN_WIDTH_INV,
        transform: 'translateX(-100%)',
        left: '100%',
    } satisfies CSSProperties;

    const bWheelStyle = {
        position: 'absolute',
        width: width / B_WHEEL_SIZE_INV,
        transform: 'translate(-50%, -100%)',
        left: '50%',
        top: '100%',
    } satisfies CSSProperties;

    const additionalItemsStyle = {
        position: 'absolute',
        width: width / COLUMN_WIDTH_INV,
        top: '45%',
        transform: 'translate(-100%, -50%)',
        left: '100%',
    } satisfies CSSProperties;

    const questItemsStyle = {
        position: 'absolute',
        width: width / COLUMN_WIDTH_INV,
        top: '45%',
        transform: 'translateY(-50%)',
    } satisfies CSSProperties;

    return (
        <div
            style={{
                position: 'relative',
                width,
                height: width / ITEM_TRACKER_ASPECT_RATIO,
            }}
        >
            <div className={styles.inGameTracker}>
                <div style={swordBlockStyle}>
                    <SwordBlock width={swordBlockStyle.width} />
                </div>
                <div style={songBlockStyle}>
                    <SongBlock width={songBlockStyle.width} />
                </div>
                <div style={questItemsStyle}>
                    <QuestItems width={questItemsStyle.width} />
                </div>
                <div style={additionalItemsStyle}>
                    <AdditionalItems width={additionalItemsStyle.width} />
                </div>
                <div style={bWheelStyle}>
                    <BWheel width={bWheelStyle.width} />
                </div>
            </div>
        </div>
    );
}
