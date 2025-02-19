import { useSelector } from 'react-redux';
import type { InventoryItem } from '../../logic/Inventory';
import { rawItemCountSelector } from '../../tracker/Selectors';
import Item from '../Item';
import styles from './CounterItem.module.css';

export function CounterItem({
    itemName,
    imgWidth,
    grid,
}: {
    itemName: InventoryItem;
    imgWidth: number;
    grid?: boolean;
}) {
    const current = useSelector(rawItemCountSelector(itemName));
    return (
        <Item
            className={styles.counterItemContainer}
            itemName={itemName}
            grid={grid}
            imgWidth={imgWidth}
        >
            {current > 0 && (
                <div className={styles.counter}>
                    <span>{current}</span>
                </div>
            )}
        </Item>
    );
}
