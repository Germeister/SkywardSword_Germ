import { addDividers } from '../utils/React';

export default function PathTooltip({ segments }: { segments: string[] }) {
    return (
        <div>
            {addDividers(
                segments,
                <>
                    <br />→{' '}
                </>,
            )}
        </div>
    );
}
