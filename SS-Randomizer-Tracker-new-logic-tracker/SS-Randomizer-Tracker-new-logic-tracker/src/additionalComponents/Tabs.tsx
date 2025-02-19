import * as Tabs from '@radix-ui/react-tabs';
import clsx from 'clsx';
import styles from './Tabs.module.css';

export function Root(
    props: Tabs.TabsProps & React.RefAttributes<HTMLDivElement>,
) {
    return <Tabs.Root {...props} />;
}

export function List(
    props: Tabs.TabsListProps & React.RefAttributes<HTMLDivElement>,
) {
    const { className, ...rest } = props;
    return <Tabs.List className={clsx(className, styles.tabsList)} {...rest} />;
}

export function Trigger(
    props: Tabs.TabsTriggerProps & React.RefAttributes<HTMLButtonElement>,
) {
    const { className, ...rest } = props;
    return (
        <Tabs.Trigger
            className={clsx(className, styles.tabsButton)}
            {...rest}
        />
    );
}

export function Content(
    props: Tabs.TabsContentProps & React.RefAttributes<HTMLDivElement>,
) {
    return <Tabs.Content {...props} />;
}
