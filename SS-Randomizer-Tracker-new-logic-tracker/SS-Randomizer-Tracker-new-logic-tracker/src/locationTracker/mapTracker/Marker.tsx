import clsx from 'clsx';
import type React from 'react';
import type { CSSProperties } from 'react';
import type { TriggerEvent } from 'react-contexify';
import Tooltip from '../../additionalComponents/Tooltip';
import type { ColorScheme } from '../../customization/ColorScheme';
import styles from './Marker.module.css';

export type PreviewStyle = 'droppable' | 'hover';
export type MarkerVariant = 'square' | 'rounded' | 'circle';
export type SubmarkerPlacement = 'left' | 'right';
export interface SubmarkerData {
    key: string;
    image: string;
    color: keyof ColorScheme;
}

const borderRadiuses: Record<MarkerVariant, string | undefined> = {
    square: styles.square,
    rounded: styles.rounded,
    circle: styles.circle,
};

export function Marker({
    variant,
    color,
    x,
    y,
    children,
    submarkers,
    submarkerPlacement = 'right',
    tooltip,
    onClick,
    onContextMenu,
    selected,
    previewStyle,
    ref,
}: {
    variant: MarkerVariant;
    color: keyof ColorScheme;
    x: number;
    y: number;
    children: React.ReactNode;
    submarkers?: SubmarkerData[];
    submarkerPlacement?: SubmarkerPlacement;
    tooltip?: React.ReactNode;
    onClick: (ev: TriggerEvent) => void;
    onContextMenu?: (ev: React.MouseEvent) => void;
    selected: boolean;
    previewStyle?: PreviewStyle;
    ref?: React.Ref<HTMLDivElement>;
}) {
    const positionVars = {
        '--map-marker-y': `${y}%`,
        '--map-marker-x': `${x}%`,
    };
    const markerStyle: CSSProperties = {
        background: `var(--scheme-${color})`,
    };

    if (selected) {
        markerStyle.boxShadow = `0 0 20px var(--scheme-${color})`;
    }

    return (
        <>
            <Tooltip content={tooltip} placement="bottom">
                <div
                    onClick={onClick}
                    onKeyDown={onClick}
                    role="button"
                    tabIndex={0}
                    onContextMenu={(ev) => {
                        ev.preventDefault();
                        onContextMenu?.(ev);
                    }}
                    style={{ ...markerStyle, ...positionVars }}
                    className={clsx(styles.marker, borderRadiuses[variant])}
                    ref={ref}
                >
                    <span>{children}</span>
                </div>
            </Tooltip>
            {previewStyle && (
                <div
                    style={positionVars as CSSProperties}
                    className={clsx({
                        [styles.droppableOutline]: Boolean(previewStyle),
                        [styles.droppableOutlineHover]:
                            previewStyle === 'hover',
                    })}
                />
            )}
            {submarkers && (
                <div
                    className={clsx(styles.submarkers, {
                        [styles.left]: submarkerPlacement === 'left',
                    })}
                    style={positionVars as CSSProperties}
                >
                    {submarkers?.map((data) => (
                        <div
                            key={data.key}
                            className={styles.submarker}
                            style={{
                                background: `var(--scheme-${data.color})`,
                            }}
                        >
                            <img src={data.image} />
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
