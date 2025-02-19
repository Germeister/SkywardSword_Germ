import type { DecodedHint } from '../hints/Hints';

export default function HintDescription({
    hint,
    area,
}: {
    hint: DecodedHint;
    area?: string;
}) {
    return (
        <div style={{ color: `var(--scheme-${hint.style})` }}>
            {area && `${area} - `}
            {hint.description}
        </div>
    );
}
