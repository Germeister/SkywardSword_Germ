import { useCallback } from 'react';
import {
    Item,
    Menu,
    Separator,
    Submenu,
    type ItemParams,
} from 'react-contexify';
import hintItems from '../data/hintItems.json';
import { findRepresentativeIcon } from '../itemTracker/Images';
import { useAppDispatch } from '../store/Store';
import { clickCheck } from '../tracker/Actions';
import { setCheckHint } from '../tracker/Slice';
import type { LocationContextMenuProps } from './Location';

type CtxProps<T = void> = ItemParams<LocationContextMenuProps, T>;
interface ItemData {
    item: string;
}

export default function LocationContextMenu() {
    const dispatch = useAppDispatch();

    const handleCheckClick = useCallback(
        (params: CtxProps) =>
            dispatch(
                clickCheck({
                    checkId: params.props!.checkId,
                    markChecked: true,
                }),
            ),
        [dispatch],
    );

    const handleUncheckClick = useCallback(
        (params: CtxProps) =>
            dispatch(
                clickCheck({
                    checkId: params.props!.checkId,
                    markChecked: false,
                }),
            ),
        [dispatch],
    );

    const handleSetItemClick = useCallback(
        (params: CtxProps<ItemData>) =>
            dispatch(
                setCheckHint({
                    checkId: params.props!.checkId,
                    hint: params.data!.item,
                }),
            ),
        [dispatch],
    );

    const handleClearItemClick = useCallback(
        (params: CtxProps<ItemData>) =>
            dispatch(
                setCheckHint({
                    checkId: params.props!.checkId,
                    hint: undefined,
                }),
            ),
        [dispatch],
    );

    return (
        <Menu id="location-context">
            <Item onClick={handleCheckClick}>Check</Item>
            <Item onClick={handleUncheckClick}>Uncheck</Item>
            <Separator />
            <Submenu label="Set Item">
                {Object.entries(hintItems).map(([category, items]) => (
                    <Submenu key={category} label={category}>
                        {items.map((listItem) => (
                            <Item
                                key={listItem}
                                onClick={handleSetItemClick}
                                data={{ item: listItem } satisfies ItemData}
                            >
                                <HintItem itemName={listItem} />
                            </Item>
                        ))}
                    </Submenu>
                ))}
            </Submenu>
            <Item onClick={handleClearItemClick}>Clear Item</Item>
        </Menu>
    );
}

export function HintIcon({ src, alt }: { src: string; alt: string }) {
    return (
        <span style={{ display: 'flex', flexFlow: 'row nowrap' }}>
            <div style={{ width: '36px', height: '36px', paddingRight: '6px' }}>
                <img
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                    src={src}
                    alt={alt}
                />
            </div>
            {alt}
        </span>
    );
}

export function HintItem({ itemName }: { itemName: string }) {
    const image = findRepresentativeIcon(itemName);
    return <HintIcon src={image} alt={itemName} />;
}
