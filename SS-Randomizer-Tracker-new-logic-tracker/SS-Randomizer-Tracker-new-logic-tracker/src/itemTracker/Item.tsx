import type { CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Tooltip from '../additionalComponents/Tooltip';
import type { InventoryItem } from '../logic/Inventory';
import {
    locationsForItemSelector,
    rawItemCountSelector,
} from '../tracker/Selectors';
import { clickItem } from '../tracker/Slice';
import { addDividers } from '../utils/React';
import { BasicItem } from './BasicItem';
import allImages from './Images';

function Item({
    itemName,
    images,
    grid,
    imgWidth,
    className,
    style,
    children,
}: {
    images?: string[];
    itemName: InventoryItem;
    imgWidth?: number | string;
    grid?: boolean;
    className?: string;
    style?: CSSProperties;
    children?: React.ReactNode;
}) {
    const dispatch = useDispatch();
    const count = useSelector(rawItemCountSelector(itemName));

    let itemImages: string[];
    if (!images) {
        if (grid) {
            itemImages = allImages[`${itemName} Grid`];
        } else {
            itemImages = allImages[itemName];
        }
    } else {
        itemImages = images;
    }

    const handleClick = (take: boolean) => {
        dispatch(clickItem({ item: itemName, take }));
    };

    const relevantLocations = useSelector(locationsForItemSelector(itemName));
    const tooltipLines: string[] = [itemName];
    if (relevantLocations.length) {
        tooltipLines.push('Found at:', ...relevantLocations);
    }

    return (
        <Tooltip delay={500} content={addDividers(tooltipLines, <br />)}>
            <BasicItem
                style={style}
                className={className}
                itemName={itemName}
                images={itemImages}
                count={count}
                imgWidth={imgWidth}
                onGiveOrTake={handleClick}
                dragItemName={itemName}
            >
                {children}
            </BasicItem>
        </Tooltip>
    );
}

export default Item;
