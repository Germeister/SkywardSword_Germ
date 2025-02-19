import type { OptionDefs, TypedOptions } from '../permalink/SettingsTypes';
import { type InventoryItem, isItem, itemMaxes } from './Inventory';
import { type PotentialLocations, getSemiLogicKeys } from './KeyLogic';
import { type Logic, isRegularItemCheck } from './Logic';
import { LogicBuilder } from './LogicBuilder';
import { mapInventory } from './Mappers';
import { getAdditionalItems } from './Misc';
import { cubeCheckToCubeCollected } from './TrackerModifications';
import {
    type Requirements,
    computeLeastFixedPoint,
    mergeRequirements,
} from './bitlogic/BitLogic';
import { BitVector } from './bitlogic/BitVector';

export interface SemiLogicState {
    semiLogicBits: BitVector;
    assumedInventory: Record<InventoryItem, number>;
    assumedChecks: Set<string>;
}

/**
 * Requirements that assume every considered trick is enabled. Enables
 * all tricks if consideredTricks is empty.
 */
export function getVisibleTricksEnabledRequirements(
    logic: Logic,
    options: OptionDefs,
    settings: TypedOptions,
    consideredTricks: Set<string>,
): Requirements {
    const requirements: Requirements = {};
    const b = new LogicBuilder(logic.allItems, logic.itemLookup, requirements);

    for (const option of options) {
        if (
            option.type === 'multichoice' &&
            (option.command === 'enabled-tricks-glitched' ||
                option.command === 'enabled-tricks-bitless')
        ) {
            const vals = option.choices;
            for (const opt of vals) {
                const considered =
                    settings[option.command].includes(opt) ||
                    !consideredTricks.size ||
                    consideredTricks.has(opt);
                if (considered) {
                    b.set(`${opt} Trick`, b.true());
                }
            }
        }
    }

    return requirements;
}

export function computeSemiLogic(
    logic: Logic,
    isCheckBanned: (checkId: string) => boolean,
    checkedChecks: Set<string>,
    inventory: Record<InventoryItem, number>,
    inLogicBits: BitVector,
    dungeonKeyLogic: PotentialLocations[],
    settingsRequirements: Requirements,
    checkHints: Record<string, string | undefined>,
    expertMode: boolean,
    allTricksRequirements: Requirements,
): { inSemiLogicBits: BitVector; inTrickLogicBits: BitVector } {
    const semiLogicState: SemiLogicState = {
        assumedChecks: new Set(checkedChecks),
        assumedInventory: { ...inventory },
        semiLogicBits: inLogicBits.clone(),
    };

    while (
        semiLogicStep(
            logic,
            isCheckBanned,
            dungeonKeyLogic,
            settingsRequirements,
            semiLogicState,
            checkHints,
        )
    ) {
        // Keep advancing through semilogic
    }

    const inSemiLogicBits = semiLogicState.semiLogicBits.clone();

    if (!expertMode) {
        return {
            inSemiLogicBits,
            inTrickLogicBits: semiLogicState.semiLogicBits,
        };
    }

    const settingsRequirementsWithTricks = {
        ...settingsRequirements,
        ...allTricksRequirements,
    };

    while (
        semiLogicStep(
            logic,
            isCheckBanned,
            dungeonKeyLogic,
            settingsRequirementsWithTricks,
            semiLogicState,
            checkHints,
        )
    ) {
        // Keep advancing through semilogic with tricks
    }

    return { inSemiLogicBits, inTrickLogicBits: semiLogicState.semiLogicBits };
}

function semiLogicStep(
    logic: Logic,
    isCheckBanned: (checkId: string) => boolean,
    dungeonKeyLogic: PotentialLocations[],
    settingsRequirements: Requirements,
    state: SemiLogicState,
    checkHints: Record<string, string | undefined>,
): boolean {
    const assumedInventoryReqs = mapInventory(logic, state.assumedInventory);
    const assumedCheckReqs = mapInventory(
        logic,
        getAdditionalItems(logic, state.assumedInventory, state.assumedChecks),
    );

    state.semiLogicBits = computeLeastFixedPoint(
        'Semilogic step',
        mergeRequirements(
            logic.numRequirements,
            logic.staticRequirements,
            settingsRequirements,
            assumedInventoryReqs,
            assumedCheckReqs,
        ),
        // Monotonicity of these requirements allows reusing semiLogicBits
        state.semiLogicBits,
    );

    let changed = false;
    // The assumed number of loose gratitude crystals is the number of
    // loose crystal checks that are either checked or are in logic.
    for (const [checkId, checkDef] of Object.entries(logic.checks)) {
        if (state.semiLogicBits.test(logic.itemBits[checkId])) {
            if (
                checkDef.type === 'loose_crystal' &&
                !state.assumedChecks.has(checkId) &&
                !isCheckBanned(checkId)
            ) {
                state.assumedChecks.add(checkId);
                changed = true;
            }

            const hintedItem = checkHints[checkId];
            if (
                isRegularItemCheck(logic.checks[checkId].type) &&
                hintedItem !== undefined &&
                isItem(hintedItem) &&
                !state.assumedChecks.has(checkId)
            ) {
                state.assumedChecks.add(checkId);
                state.assumedInventory[hintedItem] = Math.min(
                    itemMaxes[hintedItem],
                    state.assumedInventory[hintedItem] + 1,
                );
                changed = true;
            }
        }
    }

    for (const cubeCheck of Object.keys(cubeCheckToCubeCollected)) {
        if (
            state.semiLogicBits.test(logic.itemBits[cubeCheck]) &&
            !state.assumedChecks.has(cubeCheck)
        ) {
            state.assumedChecks.add(cubeCheck);
            changed = true;
        }
    }

    for (const dungeonCompletionCheck of Object.values(
        logic.dungeonCompletionRequirements,
    )) {
        if (
            state.semiLogicBits.test(logic.itemBits[dungeonCompletionCheck]) &&
            !state.assumedChecks.has(dungeonCompletionCheck)
        ) {
            state.assumedChecks.add(dungeonCompletionCheck);
            changed = true;
        }
    }

    const hasNewKeys = getSemiLogicKeys(
        logic,
        state.assumedInventory,
        dungeonKeyLogic,
        state.semiLogicBits,
        state.assumedChecks,
    );
    changed ||= hasNewKeys;

    return changed;
}
