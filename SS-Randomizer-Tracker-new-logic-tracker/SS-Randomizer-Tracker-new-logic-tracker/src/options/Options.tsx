import { useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { range } from 'es-toolkit';
import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import semverSatisfies from 'semver/functions/satisfies';
import { Checkbox } from '../additionalComponents/Checkbox';
import DiscordButton from '../additionalComponents/DiscordButton';
import {
    MultiSelect,
    Select,
    type SelectValue,
} from '../additionalComponents/Select';
import * as Tabs from '../additionalComponents/Tabs';
import Tooltip from '../additionalComponents/Tooltip';
import { ImportButton } from '../ImportExport';
import {
    LATEST_STRING,
    type RemoteReference,
    areRemotesEqual,
    formatRemote,
    parseRemote,
} from '../loader/LogicLoader';
import { useReleases } from '../loader/ReleasesLoader';
import { type LogicBundle, loadLogic } from '../logic/Slice';
import { decodePermalink, encodePermalink } from '../permalink/Settings';
import type {
    AllTypedOptions,
    Option,
    OptionDefs,
    OptionValue,
    OptionsCommand,
} from '../permalink/SettingsTypes';
import { useAppDispatch } from '../store/Store';
import { acceptSettings, reset } from '../tracker/Slice';
import { appError } from '../utils/Debug';
import Acknowledgement from './Acknowledgment';
import styles from './Options.module.css';
import { OptionsPresets } from './OptionsPresets';
import {
    type LoadingState,
    type OptionsAction,
    useOptionsState,
} from './OptionsReducer';

/** The tracker will only show these options, and tracker logic code is only allowed to access these! */
const optionCategorization_ = {
    Shuffles: [
        'rupeesanity',
        'shopsanity',
        'beedle-shopsanity',
        'luv-shopsanity',
        'rupin-shopsanity',
        'gondo-upgrades',
        'tadtonesanity',
        'treasuresanity-in-silent-realms',
        'trial-treasure-amount',
        'small-key-mode',
        'boss-key-mode',
        'empty-unrequired-dungeons',
    ],
    'Starting Items': [
        'starting-sword',
        'upgraded-skyward-strike',
        'starting-tablet-count',
        'starting-bottles',
        'starting-crystal-packs',
        'starting-tadtones',
        'starting-items',
    ],
    Entrances: [
        'random-start-entrance',
        'random-start-statues',
        'randomize-entrances',
        'randomize-dungeon-entrances',
        'randomize-trials',
        'random-puzzles',
    ],
    Convenience: [
        'open-lake-floria',
        'open-et',
        'open-lmf',
        'open-thunderhead',
        'fs-lava-flow',
        'open-shortcuts',
    ],
    Victory: [
        'got-start',
        'got-sword-requirement',
        'got-dungeon-requirement',
        'required-dungeon-count',
        'triforce-required',
        'triforce-shuffle',
    ],
    Miscellaneous: [
        'logic-mode',
        'bit-patches',
        'damage-multiplier',
        'enabled-tricks-bitless',
        'enabled-tricks-glitched',
        'excluded-locations',
        'hint-distribution',
    ],
} as const satisfies Record<string, readonly OptionsCommand[]>;

export type LogicOption =
    (typeof optionCategorization_)[keyof typeof optionCategorization_][number];
const optionCategorization: Record<string, readonly LogicOption[]> =
    optionCategorization_;

const wellKnownRemotes: {
    prettyName: string;
    remoteName: string;
}[] = [
    {
        prettyName: 'Latest Stable Release',
        remoteName: LATEST_STRING,
    },
    {
        prettyName: 'Racing Season 3',
        remoteName: 'alkalineace/season-3',
    },
    {
        prettyName: 'Latest Development Build',
        remoteName: 'ssrando/main',
    },
];

/**
 * The default landing page for the tracker. Allows choosing logic source, permalink, and settings,
 * and allows moving to the main tracker.
 *
 * This component does not expect logic to be loaded, and will help loading logic.
 * As a result, it does not access any selectors that assume logic has already loaded unless we know it's loaded.
 */
export default function Options() {
    const {
        counters,
        dispatch,
        hasChanges,
        loaded,
        loadingState,
        settings,
        selectedRemote,
    } = useOptionsState();
    const appDispatch = useAppDispatch();
    const navigate = useNavigate();

    const launch = useCallback(
        (shouldReset?: boolean) => {
            if (!loaded) {
                return;
            }
            appDispatch(loadLogic(loaded));
            if (shouldReset) {
                appDispatch(reset({ settings: settings! }));
            } else {
                appDispatch(acceptSettings({ settings: settings! }));
            }
            navigate({ to: '/tracker' });
        },
        [appDispatch, loaded, navigate, settings],
    );

    return (
        <div className={styles.optionsPage}>
            <h1>Skyward Sword Randomizer Tracker</h1>
            <div className={styles.logicAndPermalink}>
                <LogicChooser
                    selectedRemote={selectedRemote}
                    dispatch={dispatch}
                    loadingState={loadingState}
                    loadedRemoteName={loaded?.remoteName}
                />
                <PermalinkChooser
                    dispatch={dispatch}
                    options={loaded?.options}
                    settings={settings}
                />
            </div>
            <LaunchButtons
                hasChanges={hasChanges}
                counters={counters}
                loaded={Boolean(loaded)}
                launch={launch}
                dispatch={dispatch}
                currentLogic={loaded}
                currentSettings={settings}
            />
            {loaded && (
                <OptionsList
                    options={loaded.options}
                    settings={settings!}
                    dispatch={dispatch}
                />
            )}
            <hr />
            <Acknowledgement />
        </div>
    );
}

function LaunchButtons({
    loaded,
    hasChanges,
    counters,
    launch,
    dispatch,
    currentLogic,
    currentSettings,
}: {
    loaded: boolean;
    hasChanges: boolean;
    counters:
        | { numChecked: number; numAccessible: number; numRemaining: number }
        | undefined;
    launch: (shouldReset?: boolean) => void;
    dispatch: React.Dispatch<OptionsAction>;
    currentLogic: LogicBundle | undefined;
    currentSettings: AllTypedOptions | undefined;
}) {
    const canStart = loaded;
    const canResume = loaded && Boolean(counters);

    const confirmLaunch = useCallback(
        (shouldReset?: boolean) => {
            const allow =
                !shouldReset ||
                (canStart &&
                    (!canResume ||
                        window.confirm(
                            'Reset your tracker and start a new run?',
                        )));
            if (allow) {
                launch(shouldReset);
            }
        },
        [canResume, canStart, launch],
    );

    return (
        <div className={styles.launchButtons}>
            <button
                type="button"
                className="tracker-button"
                disabled={!canResume}
                onClick={() => confirmLaunch()}
            >
                <div className={styles.continueButton}>
                    <span>Continue Tracker</span>
                    <span className={styles.counters}>
                        {counters &&
                            `${counters.numChecked}/${counters.numRemaining}`}
                    </span>
                </div>
            </button>
            <button
                type="button"
                className="tracker-button"
                disabled={!canStart}
                onClick={() => confirmLaunch(true)}
            >
                Launch New Tracker
            </button>
            <ImportButton
                setLogicBranch={(remote) =>
                    dispatch({ type: 'selectRemote', remote, viaImport: true })
                }
            />
            <button
                type="button"
                className="tracker-button"
                disabled={!hasChanges}
                onClick={() => dispatch({ type: 'revertChanges' })}
            >
                Undo Changes
            </button>

            <OptionsPresets
                className={styles.presetButton}
                dispatch={dispatch}
                currentLogic={currentLogic}
                currentSettings={currentSettings}
            />
        </div>
    );
}

const leastSupportedRelease = '>=2.1.1';

function useRemoteOptions(): SelectValue<RemoteReference>[] {
    const githubReleases = useReleases();

    return useMemo(() => {
        const niceRemoteName = (remoteName: string, prettyName: string) => {
            if (remoteName === LATEST_STRING) {
                return githubReleases
                    ? `${prettyName} (${githubReleases.latest})`
                    : prettyName;
            } else {
                return `${prettyName} (${remoteName})`;
            }
        };

        const remotes = wellKnownRemotes.map(({ prettyName, remoteName }) => {
            const remote = parseRemote(remoteName)!;
            return {
                value: JSON.stringify(remote),
                payload: remote,
                label: niceRemoteName(remoteName, prettyName),
            };
        });

        if (githubReleases) {
            const supportedReleases = githubReleases.releases.filter((r) =>
                semverSatisfies(r, leastSupportedRelease),
            );
            remotes.push(
                ...supportedReleases.map((r) => {
                    const remote = {
                        type: 'releaseVersion',
                        versionTag: r,
                    } as const;
                    return {
                        value: JSON.stringify(remote),
                        payload: remote,
                        label: r,
                    };
                }),
            );
        }
        return remotes;
    }, [githubReleases]);
}

/** A component to choose your logic release. */
function LogicChooser({
    selectedRemote,
    dispatch,
    loadingState,
    loadedRemoteName,
}: {
    selectedRemote: RemoteReference;
    dispatch: React.Dispatch<OptionsAction>;
    loadingState: LoadingState | undefined;
    loadedRemoteName: string | undefined;
}) {
    const inputRef = useRef<PlaintextRef>(null);
    const wellKnownSelectOptions = useRemoteOptions();

    const activeOption = wellKnownSelectOptions.find((option) =>
        areRemotesEqual(option.payload, selectedRemote),
    );

    const setSelectedRemote = useCallback(
        (remote: RemoteReference) => dispatch({ type: 'selectRemote', remote }),
        [dispatch],
    );

    const onRemoteChange = (option: RemoteReference | undefined) => {
        if (option) {
            setSelectedRemote(option);
        }
    };

    return (
        <div className={clsx(styles.optionsCategory, styles.logicChooser)}>
            <legend>
                Randomizer Version
                {activeOption
                    ? `: ${activeOption.label}`
                    : loadedRemoteName && `: ${loadedRemoteName}`}
            </legend>
            <Tabs.Root
                defaultValue={activeOption ? 'wellKnown' : 'raw'}
                onValueChange={(e) => {
                    if (e === 'raw') {
                        inputRef.current?.setInput(
                            formatRemote(selectedRemote),
                        );
                    }
                }}
            >
                <Tabs.List>
                    <Tabs.Trigger value="wellKnown">Releases</Tabs.Trigger>
                    <Tabs.Trigger value="raw">Beta Feature</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="wellKnown">
                    <Select<RemoteReference>
                        selectedValue={activeOption}
                        onValueChange={onRemoteChange}
                        options={wellKnownSelectOptions}
                        label="Select remote"
                    />
                </Tabs.Content>
                <Tabs.Content value="raw">
                    <div>
                        Find cool beta features on the Discord <DiscordButton />
                    </div>
                    <PlaintextLogicInput
                        ref={inputRef}
                        selectedRemote={selectedRemote}
                        setSelectedRemote={setSelectedRemote}
                    />
                </Tabs.Content>
            </Tabs.Root>
            <LoadingStateIndicator loadingState={loadingState} />
        </div>
    );
}

export interface PlaintextRef {
    setInput: (text: string) => void;
}

function PlaintextLogicInput({
    selectedRemote,
    setSelectedRemote,
    ref,
}: {
    selectedRemote: RemoteReference;
    setSelectedRemote: (ref: RemoteReference) => void;
    ref: React.ForwardedRef<PlaintextRef>;
}) {
    const [input, setInput] = useState(() => formatRemote(selectedRemote));
    const parsed = useMemo(() => parseRemote(input), [input]);
    const badFormat = !parsed;
    useEffect(() => {
        if (parsed) {
            setSelectedRemote(parsed);
        }
    }, [parsed, setSelectedRemote]);

    useImperativeHandle(ref, () => ({ setInput }), []);

    return (
        <div className={styles.plaintextLogicInput}>
            <input
                type="text"
                className={clsx('tracker-input', {
                    [styles.optionsBadRemote]: badFormat,
                })}
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
        </div>
    );
}

function LoadingStateIndicator({
    loadingState,
}: {
    loadingState: LoadingState | undefined;
}) {
    return (
        <div>
            <span>
                {loadingState?.type === 'loading'
                    ? '⏳'
                    : loadingState
                      ? `❌ ${loadingState.error}`
                      : '✅'}
            </span>
        </div>
    );
}

/** A component to choose your logic release. */
function PermalinkChooser({
    options,
    settings,
    dispatch,
}: {
    options: OptionDefs | undefined;
    settings: AllTypedOptions | undefined;
    dispatch: React.Dispatch<OptionsAction>;
}) {
    const permalink = useMemo(
        () => options && encodePermalink(options, settings!),
        [options, settings],
    );

    const onChangePermalink = useCallback(
        (link: string) => {
            try {
                if (options) {
                    const settings = decodePermalink(options, link);
                    dispatch({ type: 'changeSettings', settings });
                }
            } catch (e) {
                appError('invalid permalink', link, e);
            }
        },
        [dispatch, options],
    );

    return (
        <div className={clsx(styles.optionsCategory, styles.permalinkChooser)}>
            <legend>Settings String</legend>
            <div className={styles.permalinkInput}>
                <input
                    type="text"
                    className="tracker-input"
                    disabled={!permalink}
                    placeholder="Select a Randomizer version first"
                    value={permalink ?? ''}
                    onChange={(e) => onChangePermalink(e.target.value)}
                />
            </div>
            <div>
                Paste the settings string from the Randomizer here. Settings
                strings are version-specific — you must select the correct
                release first.
            </div>
        </div>
    );
}

/** A list of all options categories. */
function OptionsList({
    options,
    settings,
    dispatch,
}: {
    options: OptionDefs;
    settings: AllTypedOptions;
    dispatch: React.Dispatch<OptionsAction>;
}) {
    return (
        <div className={styles.optionsCategory}>
            <Tabs.Root defaultValue="Shuffles">
                <Tabs.List>
                    {Object.keys(optionCategorization).map((key) => (
                        <Tabs.Trigger key={key} value={key}>
                            {key}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>
                {Object.entries(optionCategorization).map(
                    ([title, categoryOptions]) => {
                        return (
                            <Tabs.Content key={title} value={title}>
                                <div className={styles.optionsTab}>
                                    {categoryOptions.map((command) => {
                                        const entry = options.find(
                                            (o) => o.command === command,
                                        );
                                        if (!entry) {
                                            return null;
                                        }
                                        return (
                                            <Setting
                                                key={command}
                                                def={entry}
                                                value={settings[command]!}
                                                setValue={(value) =>
                                                    dispatch({
                                                        type: 'changeSetting',
                                                        command,
                                                        value,
                                                    })
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            </Tabs.Content>
                        );
                    },
                )}
            </Tabs.Root>
        </div>
    );
}

function Setting({
    def,
    value,
    setValue,
}: {
    def: Option;
    value: OptionValue;
    setValue: (val: OptionValue) => void;
}) {
    switch (def.type) {
        case 'boolean':
            return (
                <>
                    <div>
                        <OptionLabel option={def} />
                    </div>
                    <div className={styles.checkboxOption}>
                        <div>
                            <Checkbox
                                id={def.name}
                                checked={value as boolean}
                                onCheckedChange={setValue}
                            />
                        </div>
                    </div>
                </>
            );
        case 'int':
            return (
                <>
                    <div>
                        <OptionLabel option={def} />
                    </div>
                    <div>
                        <Select
                            selectedValue={{
                                value: (value as number).toString(),
                                payload: value as number,
                                label: (value as number).toString(),
                            }}
                            onValueChange={(e) =>
                                e !== undefined && setValue(e)
                            }
                            options={range(def.min, def.max + 1).map((val) => ({
                                value: val.toString(),
                                payload: val,
                                label: val.toString(),
                            }))}
                            label={def.name}
                        />
                    </div>
                </>
            );
        case 'singlechoice':
            return (
                <>
                    <div>
                        <OptionLabel option={def} />
                    </div>
                    <div>
                        <Select
                            selectedValue={{
                                value: value as string,
                                payload: value as string,
                                label: value as string,
                            }}
                            onValueChange={(e) =>
                                e !== undefined && setValue(e)
                            }
                            options={def.choices.map((val) => ({
                                value: val,
                                payload: val,
                                label: val,
                            }))}
                            label={def.name}
                        />
                    </div>
                </>
            );
        case 'multichoice': {
            const numPaddingDigits = 4;
            const onChange = (selected: string[]) => setValue(selected);
            // Hack: Ensure unique keys...........
            const options = def.choices.map((val, idx) => ({
                value: val + idx.toString().padStart(numPaddingDigits, '0'),
                payload: val,
                label: val,
            }));
            return (
                <>
                    <div>
                        <OptionLabel option={def} />
                    </div>
                    <div>
                        <MultiSelect
                            selectedValue={(value as string[]).map(
                                (val, idx) => ({
                                    value:
                                        val +
                                        idx
                                            .toString()
                                            .padStart(numPaddingDigits, '0'),
                                    payload: val,
                                    label: val,
                                }),
                            )}
                            onValueChange={onChange}
                            options={options}
                            label={def.name}
                            id={def.name}
                        />
                    </div>
                </>
            );
        }
    }
}

function OptionTooltip({ children }: { children: string }) {
    const split = children.split('**');
    return (
        <>
            {split.map((part, index) => (
                <React.Fragment key={index}>
                    {index % 2 === 1 && <br />}
                    <span
                        className={clsx(styles.optionsTooltip, {
                            [styles.bold]: index % 2 === 1,
                        })}
                    >
                        {part}
                    </span>
                </React.Fragment>
            ))}
        </>
    );
}

const OptionLabel = React.memo(function OptionLabel({
    option,
}: {
    option: Option;
}) {
    return (
        <Tooltip content={<OptionTooltip>{option.help}</OptionTooltip>}>
            <label htmlFor={option.name}>{option.name}</label>
        </Tooltip>
    );
});
