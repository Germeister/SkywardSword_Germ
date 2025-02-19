import DiscordButton from './DiscordButton';
import styles from './ExternalLinks.module.css';

const sourceCode = 'https://github.com/robojumper/SS-Randomizer-Tracker';

export function ExternalLinks() {
    return (
        <div className={styles.links}>
            <SourceCodeLink />
            <DiscordButton />
        </div>
    );
}

function SourceCodeLink() {
    return (
        <a rel="noreferrer noopener" target="_blank" href={sourceCode}>
            View the Source Code <i className="fab fa-github" />
        </a>
    );
}
