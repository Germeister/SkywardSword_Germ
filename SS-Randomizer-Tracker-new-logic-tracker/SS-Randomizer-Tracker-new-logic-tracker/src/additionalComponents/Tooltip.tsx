import { Arrow } from '@radix-ui/react-arrow';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import styles from './Tooltip.module.css';

export default function Tooltip({
    content,
    children,
    placement,
    disabled,
    delay = 0,
    forceOpen,
}: {
    content: React.ReactNode;
    children: React.ReactElement;
    placement?: 'bottom' | 'top';
    disabled?: boolean;
    delay?: number;
    forceOpen?: boolean;
}) {
    if (disabled) {
        return children;
    }
    return (
        // eslint-disable-next-line @eslint-react/no-context-provider
        <RadixTooltip.Provider delayDuration={delay} disableHoverableContent>
            <RadixTooltip.Root open={forceOpen}>
                <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                    <RadixTooltip.Content
                        hideWhenDetached={!forceOpen}
                        className={styles.tooltip}
                        side={placement}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {content}
                        <RadixTooltip.Arrow className={styles.arrow} />
                    </RadixTooltip.Content>
                </RadixTooltip.Portal>
            </RadixTooltip.Root>
        </RadixTooltip.Provider>
    );
}

export function FakeTooltip({ content }: { content: React.ReactNode }) {
    return (
        <div className={styles.fakeTooltipWrapper}>
            <div className={styles.tooltip}>{content}</div>
            <Arrow className={styles.arrow} />
        </div>
    );
}
