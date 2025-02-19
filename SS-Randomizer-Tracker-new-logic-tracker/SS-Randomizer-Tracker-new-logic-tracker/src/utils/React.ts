import useResizeObserver from '@react-hook/resize-observer';
import React, { cloneElement, useLayoutEffect, useState } from 'react';

/** places a divider between each element of arr */
export function addDividers<T extends React.ReactNode>(
    arr: T[],
    divider: React.ReactElement,
): React.ReactNode[] {
    return arr.flatMap((e, i) => [
        // eslint-disable-next-line @eslint-react/no-clone-element
        i ? cloneElement(divider, { key: `divider-${i}` }) : null,
        e,
    ]);
}

/**
 * Measure an unconditionally rendered element's size.
 * Ref must be set after the first render and stable
 * after that, since we don't react to ref changes.
 */
export function useElementSize(ref: React.RefObject<HTMLElement | null>) {
    const [measuredWidth, setMeasuredWidth] = useState(0);
    const [measuredHeight, setMeasuredHeight] = useState(0);

    useLayoutEffect(() => {
        const elem = ref.current;
        if (!elem) {
            return;
        }
        setMeasuredWidth(elem.clientWidth);
        setMeasuredHeight(elem.clientHeight);
    }, [ref]);

    useResizeObserver(ref, () => {
        const elem = ref.current;
        if (!elem) {
            return;
        }
        setMeasuredWidth(elem.clientWidth);
        setMeasuredHeight(elem.clientHeight);
    });

    return { measuredWidth, measuredHeight };
}
