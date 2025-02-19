import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    pointerWithin,
    useDraggable as useDraggableDndKit,
    useDroppable as useDroppableDndKit,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { useCallback, useId, useState } from 'react';
import { useDispatch } from 'react-redux';
import { dungeonToPathImage, type Hint } from '../hints/Hints';
import { findRepresentativeIcon } from '../itemTracker/Images';
import type { InventoryItem } from '../logic/Inventory';
import { type DungeonName, dungeonNames } from '../logic/Locations';
import { setCheckHint, setHint } from '../tracker/Slice';

export type TrackerDraggable =
    | {
          type: 'item';
          item: InventoryItem;
      }
    | {
          type: 'dungeon';
          dungeon: DungeonName;
      };

export type TrackerDroppable =
    | {
          type: 'location';
          checkId: string;
      }
    | {
          type: 'hintRegion';
          hintRegion: string;
      };

export function useDraggable(data: TrackerDraggable | undefined) {
    const id = useId();
    const { listeners, setNodeRef } = useDraggableDndKit({
        id,
        data,
        disabled: !data,
    });

    return { listeners, setNodeRef };
}

export function useDroppable(data: TrackerDroppable | undefined) {
    const id = useId();
    const { active, isOver, setNodeRef } = useDroppableDndKit({
        id,
        data,
        disabled: !data,
    });

    return {
        isOver,
        setNodeRef,
        active:
            (active && (active.data.current as TrackerDraggable | undefined)) ??
            undefined,
    };
}

export function draggableToRegionHint(draggable: TrackerDraggable): Hint {
    switch (draggable.type) {
        case 'item': {
            return {
                type: 'item',
                item: draggable.item,
            };
        }
        case 'dungeon': {
            return {
                type: 'path',
                index: dungeonNames.indexOf(draggable.dungeon),
            };
        }
    }
}

export function DragAndDropContext({
    children,
}: {
    children: React.ReactNode;
}) {
    const dispatch = useDispatch();
    const [dragPreview, setDragPreview] = useState<string | undefined>();
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const dragged = event.active.data.current as
            | TrackerDraggable
            | undefined;
        if (!dragged) {
            return;
        }
        if (dragged.type === 'item') {
            setDragPreview(findRepresentativeIcon(dragged.item));
        } else if (dragged.type === 'dungeon') {
            setDragPreview(dungeonToPathImage[dragged.dungeon]);
        }
    }, []);
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const dragged = event.active.data.current as
                | TrackerDraggable
                | undefined;
            if (!dragged) {
                return;
            }
            const target =
                event.over &&
                (event.over.data.current as TrackerDroppable | undefined);
            if (target?.type === 'hintRegion') {
                const hint = draggableToRegionHint(dragged);
                if (hint) {
                    dispatch(
                        setHint({
                            areaId: target.hintRegion,
                            hint,
                        }),
                    );
                }
            }
            if (dragged.type === 'item' && target?.type === 'location') {
                dispatch(
                    setCheckHint({
                        checkId: target.checkId,
                        hint: dragged.item,
                    }),
                );
            }
            setDragPreview(undefined);
        },
        [dispatch],
    );
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );
    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            collisionDetection={pointerWithin}
        >
            {children}
            <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
                <div style={{ position: 'relative', width: 72, height: 72 }}>
                    {dragPreview ? (
                        <img
                            src={dragPreview}
                            style={{
                                position: 'absolute',
                                transform: 'translate(36px, 36px)',
                            }}
                            width={72}
                        />
                    ) : undefined}
                </div>
            </DragOverlay>
        </DndContext>
    );
}
