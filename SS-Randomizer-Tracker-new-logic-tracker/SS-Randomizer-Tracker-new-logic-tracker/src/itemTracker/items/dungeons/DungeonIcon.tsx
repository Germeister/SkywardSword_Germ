import clsx from 'clsx';
import {
    draggableToRegionHint,
    useDroppable,
} from '../../../dragAndDrop/DragAndDrop';
import keyDownWrapper from '../../../utils/KeyDownWrapper';
import styles from './DungeonIcon.module.css';

function DungeonIcon({
    image,
    iconLabel,
    groupClicked,
    area,
}: {
    image: string;
    iconLabel: string;
    groupClicked: (group: string) => void;
    area: string;
}) {
    const onClick = () => {
        groupClicked(area);
    };

    const { setNodeRef, active, isOver } = useDroppable({
        type: 'hintRegion',
        hintRegion: area,
    });

    const dragPreviewHint = active && draggableToRegionHint(active);
    const canDrop = Boolean(dragPreviewHint);

    return (
        <div
            ref={setNodeRef}
            className={clsx({
                [styles.droppable]: canDrop,
                [styles.droppableHover]: canDrop && isOver,
            })}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={keyDownWrapper(onClick)}
            style={{ width: '100%' }}
        >
            <img src={image} alt={iconLabel} style={{ width: '100%' }} />
        </div>
    );
}

export default DungeonIcon;
