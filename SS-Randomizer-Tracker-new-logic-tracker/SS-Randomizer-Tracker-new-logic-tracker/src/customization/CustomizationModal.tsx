import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Checkbox } from '../additionalComponents/Checkbox';
import { Dialog } from '../additionalComponents/Dialog';
import {
    MultiSelect,
    Select,
    type SelectValue,
} from '../additionalComponents/Select';
import Tooltip from '../additionalComponents/Tooltip';
import { isLogicLoadedSelector, optionsSelector } from '../logic/Selectors';
import { type ThunkResult, useAppDispatch } from '../store/Store';
import ColorBlock from './ColorBlock';
import {
    type ColorScheme,
    darkColorScheme,
    lightColorScheme,
} from './ColorScheme';
import styles from './CustomizationModal.module.css';
import {
    colorSchemeSelector,
    counterBasisSelector,
    hasCustomLayoutSelector,
    itemLayoutSelector,
    itemLocationAssignmentEnabledSelector,
    locationLayoutSelector,
    trickSemiLogicSelector,
    trickSemiLogicTrickListSelector,
    tumbleweedSelector,
} from './Selectors';
import {
    type CounterBasis,
    type ItemLayout,
    type LocationLayout,
    setAutoItemAssignment,
    setColorScheme,
    setCounterBasis,
    setCustomLayout,
    setEnabledSemilogicTricks,
    setItemLayout,
    setLocationLayout,
    setTrackTumbleweed,
    setTrickSemiLogic,
} from './Slice';

const defaultColorSchemes = {
    Light: lightColorScheme,
    Dark: darkColorScheme,
};

const locationLayouts: SelectValue<LocationLayout>[] = [
    { value: 'list', payload: 'list', label: 'List Layout' },
    { value: 'map', payload: 'map', label: 'Map Layout' },
];
const itemLayouts: SelectValue<ItemLayout>[] = [
    { value: 'inventory', payload: 'inventory', label: 'In-Game Inventory' },
    { value: 'grid', payload: 'grid', label: 'Grid Layout' },
];
const counterBases: SelectValue<CounterBasis>[] = [
    { value: 'logic', payload: 'logic', label: 'In Logic' },
    { value: 'semilogic', payload: 'semilogic', label: 'Semi-Logic' },
];

const colors: { key: keyof ColorScheme; name: string }[] = [
    { key: 'background', name: 'Background' },
    { key: 'text', name: 'Foreground' },
    { key: 'interact', name: 'Interact' },
    { key: 'inLogic', name: 'In Logic Check' },
    { key: 'outLogic', name: 'Out of Logic Check' },
    { key: 'semiLogic', name: 'Semi-Logic Check' },
    { key: 'trickLogic', name: 'Trick Logic Check' },
    { key: 'unrequired', name: 'Unrequired Dungeon' },
    { key: 'required', name: 'Required Dungeon' },
    { key: 'checked', name: 'Completed Check' },
];

function importCustomLayout(): ThunkResult {
    return (dispatch, getState) => {
        const existingLayout = getState().customization.customLayout;
        const newLayout =
            window.prompt(
                'Paste custom layout here (empty to clear)',
                existingLayout,
            ) || undefined;
        dispatch(setCustomLayout(newLayout));
    };
}

function Setting({
    name,
    tooltip,
    children,
}: {
    name: string;
    tooltip?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={styles.setting}>
            <Tooltip content={tooltip ?? ''} disabled={!tooltip}>
                <div className={styles.header}>{name}</div>
            </Tooltip>
            <div className={styles.contents}>{children}</div>
        </div>
    );
}

export default function CustomizationModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const dispatch = useAppDispatch();
    const colorScheme = useSelector(colorSchemeSelector);
    const layout = useSelector(itemLayoutSelector);
    const locationLayout = useSelector(locationLayoutSelector);
    const trickSemiLogic = useSelector(trickSemiLogicSelector);
    const counterBasis = useSelector(counterBasisSelector);
    const tumbleweed = useSelector(tumbleweedSelector);
    const itemLocationAssignment = useSelector(
        itemLocationAssignmentEnabledSelector,
    );
    const isLogicLoaded = useSelector(isLogicLoadedSelector);

    const updateColorScheme = useCallback(
        (scheme: ColorScheme) => dispatch(setColorScheme(scheme)),
        [dispatch],
    );

    const hasCustomLayout = useSelector(hasCustomLayoutSelector);

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            title="Tracker Customization"
            className={styles.modal}
        >
            <Setting name="Presets">
                <div className={styles.colorPresets}>
                    {Object.entries(defaultColorSchemes).map(
                        ([key, scheme]) => (
                            <div key={key}>
                                <button
                                    type="button"
                                    className="tracker-button"
                                    style={{
                                        background: scheme.background,
                                        color: scheme.text,
                                        border: '1px solid var(--scheme-text)',
                                    }}
                                    onClick={() => updateColorScheme(scheme)}
                                >
                                    {key}
                                </button>
                            </div>
                        ),
                    )}
                </div>
            </Setting>
            <Setting name="Colors">
                {colors.map(({ key, name }) => (
                    <ColorBlock
                        key={key}
                        colorName={name}
                        schemeKey={key}
                        colorScheme={colorScheme}
                        updateColorScheme={updateColorScheme}
                    />
                ))}
            </Setting>

            <Setting name="Item Tracker Settings">
                <Select
                    disabled={hasCustomLayout}
                    selectedValue={itemLayouts.find((l) => l.value === layout)}
                    onValueChange={(e) => e && dispatch(setItemLayout(e))}
                    options={itemLayouts}
                    label="Item Layout"
                />
            </Setting>
            <Setting name="Location Tracker Settings">
                <Select
                    disabled={hasCustomLayout}
                    selectedValue={locationLayouts.find(
                        (l) => l.value === locationLayout,
                    )}
                    onValueChange={(e) => e && dispatch(setLocationLayout(e))}
                    options={locationLayouts}
                    label="Location Layout"
                />
            </Setting>
            <Setting
                name="Trick Logic"
                tooltip="Choose whether checks reachable only with tricks should be highlighted in a separate color, and which checks should be shown. An empty tricks list shows all tricks."
            >
                <div className={styles.labeledCheckbox}>
                    <Checkbox
                        id="trickLogic"
                        checked={trickSemiLogic}
                        onCheckedChange={(e) => dispatch(setTrickSemiLogic(e))}
                    />
                    <label htmlFor="trickLogic">Show Trick Logic</label>
                </div>
                {isLogicLoaded ? (
                    <TricksChooser enabled={trickSemiLogic} />
                ) : (
                    "Cannot customize tricks here because logic isn't loaded"
                )}
            </Setting>
            <Setting
                name="Counter Basis"
                tooltip="Choose whether the Area/Total Locations Accessible counters should include items in semi-logic."
            >
                <Select
                    selectedValue={counterBases.find(
                        (l) => l.value === counterBasis,
                    )}
                    onValueChange={(e) => e && dispatch(setCounterBasis(e))}
                    options={counterBases}
                    label="Counter Basis"
                />
            </Setting>
            <Setting name="Additional Settings">
                <div className={styles.labeledCheckbox}>
                    <Checkbox
                        id="trackTim"
                        checked={tumbleweed}
                        onCheckedChange={(e) => dispatch(setTrackTumbleweed(e))}
                    />
                    <label htmlFor="trackTim">Track Tim</label>
                </div>
                <div className={styles.labeledCheckbox}>
                    <Checkbox
                        id="autoItemAssignemt"
                        checked={itemLocationAssignment}
                        onCheckedChange={(e) =>
                            dispatch(setAutoItemAssignment(e))
                        }
                    />
                    <label htmlFor="autoItemAssignemt">
                        Assign Items to locations while tracking
                    </label>
                </div>
            </Setting>
            <Setting name="Custom Layout (experimental!)">
                <div>
                    <button
                        type="button"
                        className="tracker-button"
                        onClick={() => {
                            dispatch(importCustomLayout());
                        }}
                    >
                        Import custom layout
                    </button>
                </div>
            </Setting>
        </Dialog>
    );
}

function TricksChooser({ enabled }: { enabled: boolean }) {
    const dispatch = useDispatch();
    const options = useSelector(optionsSelector);
    const enabledTricks = useSelector(trickSemiLogicTrickListSelector);

    const onChange = useCallback(
        (tricks: string[]) => {
            dispatch(setEnabledSemilogicTricks(tricks));
        },
        [dispatch],
    );

    const choices = useMemo(
        () =>
            options
                .filter(
                    (o) =>
                        o.command === 'enabled-tricks-bitless' ||
                        o.command === 'enabled-tricks-glitched',
                )
                .flatMap((o) => (o.type === 'multichoice' ? o.choices : []))
                .map((o) => ({ value: o, payload: o, label: o })),
        [options],
    );

    const value = useMemo(
        () =>
            [...enabledTricks].map((o) => ({ value: o, payload: o, label: o })),
        [enabledTricks],
    );

    return (
        <MultiSelect<string>
            disabled={!enabled}
            selectedValue={value}
            onValueChange={onChange}
            options={choices}
            label="Enabled Tricks"
            searchable
            clearable={false}
        />
    );
}
