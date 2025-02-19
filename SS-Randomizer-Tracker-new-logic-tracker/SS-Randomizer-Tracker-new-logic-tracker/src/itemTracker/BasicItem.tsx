import { mergeProps, mergeRefs } from '@react-aria/utils';
import clsx from 'clsx';
import { last } from 'es-toolkit';
import { useDraggable } from '../dragAndDrop/DragAndDrop';
import type { InventoryItem } from '../logic/Inventory';
import keyDownWrapper from '../utils/KeyDownWrapper';
import './BasicItem.css';

/**
 * The fundamental controlled item component.
 * Should rarely be used directly, instead use Item / GratitudeCrystals / Wallet
 * components which internally use this BasicItem.
 */
export function BasicItem({
    itemName,
    images,
    imgWidth,
    className,
    count,
    onGiveOrTake,
    children,
    style,
    dragItemName,
    ...restProps
}: {
    /** A human-readable accessibility name */
    itemName: string;
    /** The list of item images, one entry per possible count */
    images: string[];
    /** A fixed item width, if needed. Otherwise 100% */
    imgWidth?: number | string;
    /** An optional class name to customize this item's style */
    className?: string;
    /** The item count */
    count: number;
    /** Click callback for the main item */
    onGiveOrTake: (take: boolean) => void;
    /** If this item can be dragged and dropped, this is the item that will be dragged */
    dragItemName?: InventoryItem;
    children?: React.ReactNode;
} & React.HTMLProps<HTMLDivElement>) {
    const handleClick = (e: React.UIEvent) => {
        if (e.type === 'contextmenu') {
            onGiveOrTake(true);
            e.preventDefault();
        } else {
            onGiveOrTake(false);
        }
    };

    const { listeners, setNodeRef } = useDraggable(
        dragItemName
            ? {
                  type: 'item',
                  item: dragItemName,
              }
            : undefined,
    );

    return (
        <div
            {...mergeProps(listeners, restProps)}
            className={clsx('item-container', className)}
            onClick={handleClick}
            onContextMenu={handleClick}
            onKeyDown={keyDownWrapper(handleClick)}
            role="button"
            draggable
            tabIndex={0}
            style={{ width: imgWidth, ...style }}
            ref={mergeRefs(setNodeRef, restProps.ref)}
        >
            <img
                draggable={false}
                src={images[count] ?? last(images)}
                alt={itemName}
            />
            {children}
        </div>
    );
}
