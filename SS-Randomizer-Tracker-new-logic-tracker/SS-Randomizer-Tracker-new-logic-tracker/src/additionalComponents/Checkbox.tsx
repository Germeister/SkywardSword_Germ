import {
    Indicator as RadixIndicator,
    Root as RadixRoot,
} from '@radix-ui/react-checkbox';
import styles from './Checkbox.module.css';

export function Checkbox({
    id,
    disabled,
    checked,
    onCheckedChange,
}: {
    disabled?: boolean;
    id: string;
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
}) {
    return (
        <RadixRoot
            className={styles.root}
            id={id}
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
        >
            <RadixIndicator className={styles.indicator}>
                <div className={styles.check} />
            </RadixIndicator>
        </RadixRoot>
    );
}
