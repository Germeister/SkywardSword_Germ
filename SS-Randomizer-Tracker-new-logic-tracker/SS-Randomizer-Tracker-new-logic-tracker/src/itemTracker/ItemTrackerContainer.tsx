import { useRef } from 'react';
import { useElementSize } from '../utils/React';

/** A wrapper component for the ItemTracker that fills the available space while retaining aspect ratio */
export function ItemTrackerContainer({
    itemTracker,
    aspectRatio,
}: {
    itemTracker: (width: number) => React.ReactNode;
    aspectRatio: number;
}) {
    const ref = useRef<HTMLDivElement | null>(null);

    const { measuredWidth, measuredHeight } = useElementSize(ref);
    const targetWidth = Math.min(measuredWidth, measuredHeight * aspectRatio);
    return (
        <div style={{ width: '100%', height: '100%' }} ref={ref}>
            {/* placed absolutely in here so that we don't end up influencing our measurement */}
            <div style={{ position: 'absolute' }}>
                {itemTracker(targetWidth)}
            </div>
        </div>
    );
}
