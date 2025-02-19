import { Link } from '@tanstack/react-router';
import Contributor from '../additionalComponents/Contributor';
import { ExternalLinks } from '../additionalComponents/ExternalLinks';
import contributors from '../data/contributors.json';
import styles from './FullAcknowledgement.module.css';

function ContributorTable({
    contributorsList,
}: {
    contributorsList: {
        name: string;
        links: { [platform: string]: string | undefined };
        attributions?: string[];
    }[];
}) {
    return (
        <div className={styles.contributorsList}>
            {contributorsList.map((contributor) => (
                <div key={contributor.name}>
                    <div>
                        <div>
                            <Contributor
                                name={contributor.name}
                                links={contributor.links}
                            />
                        </div>
                    </div>
                    {contributor.attributions?.map((attribution, index) => (
                        <div key={index}>
                            <i>{attribution}</i>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function FullAcknowledgement() {
    const rows = [
        ['Lead Developer', contributors.creators],
        ['Contributors', contributors.contributors],
        ['Additional Shoutouts', contributors.additionalShoutouts],
    ] as const;
    return (
        <div className={styles.ackContainer}>
            <div>
                <Link to="/">Return to Tracker</Link>
            </div>
            {rows.map(([header, list]) => {
                return (
                    <div key={header}>
                        <div className={styles.ackGroupHeader}>{header}</div>
                        <ContributorTable contributorsList={list} />
                    </div>
                );
            })}
            <ExternalLinks />
        </div>
    );
}
