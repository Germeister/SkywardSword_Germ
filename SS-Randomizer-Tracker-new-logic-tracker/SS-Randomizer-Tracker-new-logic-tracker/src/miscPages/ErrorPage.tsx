import { useDispatch, useSelector } from 'react-redux';
import DiscordButton from '../additionalComponents/DiscordButton';
import { hasCustomLayoutSelector } from '../customization/Selectors';
import { setCustomLayout } from '../customization/Slice';
import { ExportButton } from '../ImportExport';
import { clearStoredRemote } from '../LocalStorage';
import { convertError } from '../utils/Errors';

export default function ErrorPage({
    error,
    resetErrorBoundary,
}: {
    error: unknown;
    resetErrorBoundary: () => void;
}) {
    const errorMsg = convertError(error);
    const hasCustomLayout = useSelector(hasCustomLayoutSelector);
    const dispatch = useDispatch();
    return (
        <div>
            <div>
                Something went wrong. Try reloading the page, reset the tracker,
                or load a different logic version:
            </div>
            <pre style={{ color: 'red' }}>{errorMsg}</pre>
            <div>
                We would appreciate a bug report with an attached tracker export
                and a screenshot of the browser console (
                <code>Ctrl+Shift+J</code>)
            </div>
            <div>
                <DiscordButton />
            </div>
            <br />
            <div style={{ display: 'flex', gap: 4 }}>
                <ExportButton />
                <button
                    type="button"
                    className="tracker-button"
                    onClick={() => window.location.reload()}
                >
                    Reload Page
                </button>
                {hasCustomLayout && (
                    <button
                        type="button"
                        className="tracker-button"
                        onClick={() => {
                            dispatch(setCustomLayout(undefined));
                            resetErrorBoundary();
                        }}
                    >
                        Remove Custom Layout
                    </button>
                )}
                <button
                    type="button"
                    className="tracker-button"
                    onClick={() => {
                        clearStoredRemote();
                        window.location.reload();
                    }}
                >
                    Choose a different release
                </button>
            </div>
            <div>
                If the error persists, you may try clearing all cookies and site
                data.{' '}
                <strong>
                    This will reset the tracker and revert all customization.
                </strong>
            </div>
            {error && typeof error === 'object' && 'stack' in error ? (
                <pre style={{ color: 'red' }}>{error.stack as string}</pre>
            ) : undefined}
        </div>
    );
}
