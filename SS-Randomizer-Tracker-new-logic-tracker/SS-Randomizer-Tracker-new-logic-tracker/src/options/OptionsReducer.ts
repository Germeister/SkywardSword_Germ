import { useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    type RemoteReference,
    areRemotesEqual,
    loadRemoteLogic,
} from '../loader/LogicLoader';
import { getStoredRemote } from '../LocalStorage';
import type { RawLogic, RawPresets } from '../logic/UpstreamTypes';
import { validateSettings } from '../permalink/Settings';
import type {
    AllTypedOptions,
    OptionDefs,
    OptionValue,
    OptionsCommand,
} from '../permalink/SettingsTypes';
import type { RootState } from '../store/Store';
import { totalCountersSelector } from '../tracker/Selectors';
import { withCancel } from '../utils/CancelToken';
import { appError } from '../utils/Debug';
import { convertError } from '../utils/Errors';
import { delay } from '../utils/Promises';

const defaultUpstream: RemoteReference = {
    type: 'latestRelease',
};

/**
 * The Options page doesn't directly write its results to Redux, instead
 * it keeps a temporary copy that's either committed or discarded.
 */
export interface OptionsState {
    selectedRemote: RemoteReference;
    settings: Partial<AllTypedOptions>;

    backupRemote: RemoteReference;
    backupSettings: Partial<AllTypedOptions>;
    hasChanges: boolean;
}

export type OptionsAction =
    | {
          type: 'changeSetting';
          command: OptionsCommand;
          value: OptionValue;
      }
    | {
          type: 'changeSettings';
          settings: AllTypedOptions;
      }
    | {
          type: 'selectRemote';
          remote: RemoteReference;
          viaImport?: boolean;
      }
    | {
          type: 'applyPreset';
          remote: RemoteReference;
          settings: AllTypedOptions;
      }
    | {
          type: 'revertChanges';
      };

function initialOptionsState({
    reduxRemote,
    reduxSettings,
}: {
    reduxSettings: Partial<AllTypedOptions>;
    reduxRemote: RemoteReference | undefined;
}): OptionsState {
    const remote = reduxRemote ?? getStoredRemote() ?? defaultUpstream;
    return {
        hasChanges: false,
        selectedRemote: remote,
        backupRemote: remote,
        settings: reduxSettings,
        backupSettings: reduxSettings,
    };
}

function optionsReducer(storedSettings: Partial<AllTypedOptions>) {
    return (state: OptionsState, action: OptionsAction): OptionsState => {
        switch (action.type) {
            case 'changeSetting': {
                const { command, value } = action;
                return {
                    ...state,
                    settings: { ...state.settings, [command]: value },
                    hasChanges: true,
                };
            }
            case 'changeSettings': {
                const { settings } = action;
                return { ...state, settings, hasChanges: true };
            }
            case 'revertChanges': {
                return {
                    ...state,
                    selectedRemote: state.backupRemote,
                    settings: state.backupSettings,
                    hasChanges: false,
                };
            }
            case 'applyPreset': {
                return {
                    ...state,
                    selectedRemote: action.remote,
                    settings: action.settings,
                };
            }
            case 'selectRemote': {
                const newState = {
                    ...state,
                    selectedRemote: action.remote,
                    hasChanges:
                        state.hasChanges ||
                        !areRemotesEqual(action.remote, state.selectedRemote),
                };

                if (action.viaImport) {
                    newState.backupRemote = action.remote;
                    newState.settings = storedSettings;
                    newState.backupSettings = storedSettings;
                    newState.hasChanges = false;
                }

                return newState;
            }
        }
    };
}

export type LoadingState =
    | { type: 'loading' }
    | {
          type: 'downloadError';
          error: string;
      }
    | {
          type: 'corruptDump';
          error: string;
      };

async function loadRemote(
    remote: RemoteReference,
): Promise<[RawLogic, OptionDefs, RawPresets, string] | string> {
    try {
        return await loadRemoteLogic(remote);
    } catch (e) {
        return convertError(e);
    }
}

export function useOptionsState() {
    const reduxLoaded = useSelector((state: RootState) => state.logic.loaded);
    const reduxSettings = useSelector(
        (state: RootState) => state.tracker.settings,
    );
    const [state, dispatch] = useReducer(
        optionsReducer(reduxSettings),
        { reduxRemote: reduxLoaded?.remote, reduxSettings },
        initialOptionsState,
    );

    const completeState = useSelector((state: RootState) => state, {
        devModeChecks: { identityFunctionCheck: 'never' },
    });

    const [loadingState, setLoadingState] = useState<LoadingState | undefined>({
        type: 'loading',
    });

    const [loadedBundle, setLoadedBundle] = useState(reduxLoaded);

    useEffect(() => {
        const [cancelToken, cancel] = withCancel();

        if (
            loadedBundle &&
            areRemotesEqual(state.selectedRemote, loadedBundle.remote)
        ) {
            setLoadingState(undefined);
            return undefined;
        }

        (async () => {
            await delay(500);
            if (!cancelToken.canceled) {
                setLoadingState({ type: 'loading' });
                const result = await loadRemote(state.selectedRemote);
                if (!cancelToken.canceled) {
                    if (typeof result === 'string') {
                        setLoadingState({
                            type: 'downloadError',
                            error: result,
                        });
                    } else {
                        const [logic, options, presets, remoteName] = result;
                        setLoadingState(undefined);
                        setLoadedBundle({
                            logic,
                            options,
                            remote: state.selectedRemote,
                            presets,
                            remoteName,
                        });
                    }
                }
            }
        })();

        return cancel;
    }, [dispatch, loadedBundle, loadedBundle?.remote, state.selectedRemote]);

    const validatedSettings = useMemo(
        () =>
            loadedBundle &&
            validateSettings(loadedBundle.options, state.settings),
        [loadedBundle, state.settings],
    );

    // Here we "speculatively" run the tracker algorithms to output total counters.
    // This is used to show a "Continue (numChecked/numRemaining)" button in the options
    // menu, and if a dump turns out to be bad, we can catch that here, show an error
    // message, and prevent the user from clicking "start" and just getting an error page.
    const [continueCounters, evaluationError] = useMemo(() => {
        if (!loadedBundle) {
            return [undefined, undefined];
        }
        const mergedState: RootState = {
            customization: completeState.customization,
            tracker: { ...completeState.tracker, settings: state.settings },
            logic: {
                loaded: loadedBundle,
            },
            saves: { presets: [] },
        };
        let counters: ReturnType<typeof totalCountersSelector> | undefined;
        let evalError: string | undefined;
        try {
            counters = totalCountersSelector(mergedState);
        } catch (e) {
            appError('failed to evaluate counters', e);
            evalError = convertError(e);
        }

        return [
            completeState.tracker.hasBeenModified ? counters : undefined,
            evalError,
        ] as const;
    }, [
        completeState.customization,
        completeState.tracker,
        loadedBundle,
        state.settings,
    ]);

    const returnedLoadingState: LoadingState | undefined =
        loadingState ??
        (evaluationError
            ? { type: 'corruptDump', error: evaluationError }
            : undefined);
    const returnedBundle = evaluationError ? undefined : loadedBundle;

    return {
        dispatch,
        loadingState: returnedLoadingState,
        hasChanges: state.hasChanges,
        counters: continueCounters,
        settings: validatedSettings,
        selectedRemote: state.selectedRemote,
        loaded: returnedBundle,
    };
}
