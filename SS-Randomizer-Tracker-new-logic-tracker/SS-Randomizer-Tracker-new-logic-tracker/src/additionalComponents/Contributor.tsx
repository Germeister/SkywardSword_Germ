import styles from './Contributor.module.css';

export default function Contributor({
    name,
    links,
}: {
    name: string;
    links: { [platform: string]: string | undefined };
}) {
    return (
        <div className={styles.contributor}>
            <span>{name}</span>
            {Object.entries(links).map(([type, link]) => (
                <a key={link} href={link} aria-label={type}>
                    <i className={`fab fa-${type}`} />
                </a>
            ))}
        </div>
    );
}
