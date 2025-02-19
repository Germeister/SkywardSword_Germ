import { Link } from '@tanstack/react-router';
import Contributor from '../additionalComponents/Contributor';
import { ExternalLinks } from '../additionalComponents/ExternalLinks';
import contributors from '../data/contributors.json';
import styles from './Acknowledgement.module.css';

export default function Acknowledgement() {
    return (
        <div className={styles.ackContainer}>
            <div>Tracker by</div>
            <div className={styles.contributorsList}>
                {contributors.creators.map((creator) => (
                    <Contributor
                        key={creator.name}
                        name={creator.name}
                        links={creator.links}
                    />
                ))}
            </div>
            <div>Additional contributions by</div>
            <div className={styles.contributorsList}>
                {contributors.contributors.map((creator) => (
                    <Contributor
                        key={creator.name}
                        name={creator.name}
                        links={creator.links}
                    />
                ))}
            </div>
            <ExternalLinks />
            <br />
            <div>
                <Link to="/acknowledgement">Full Acknowledgement</Link>
                {' ⋅ '}
                <Link to="/guide">User Guide</Link>
            </div>
        </div>
    );
}
