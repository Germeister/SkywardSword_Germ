import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from 'react';
import { useSelector } from 'react-redux';
import {
    trickSemiLogicSelector,
    trickSemiLogicTrickListSelector,
} from '../customization/Selectors';
import { mergeRequirements } from '../logic/bitlogic/BitLogic';
import type { ExplorationNode } from '../logic/Pathfinding';
import { logicSelector, optionsSelector } from '../logic/Selectors';
import {
    getRequirementLogicalStateSelector,
    inLogicPathfindingSelector,
    optimisticPathfindingSelector,
    settingSelector,
    settingsRequirementsSelector,
    settingsSelector,
} from '../tracker/Selectors';
import { noop } from '../utils/Function';
import { TooltipComputer } from './TooltipComputations';
import {
    type RootTooltipExpression,
    booleanExprToTooltipExpr,
} from './TooltipExpression';

const TooltipsContext = createContext<TooltipComputer | null>(null);

/**
 * A context and cache for the tooltip expressions.
 */
export function MakeTooltipsAvailable({ children }: { children: ReactNode }) {
    const [analyzer, setAnalyzer] = useState<TooltipComputer | null>(null);

    const logic = useSelector(logicSelector);
    const options = useSelector(optionsSelector);
    const settings = useSelector(settingsSelector);
    const settingsRequirements = useSelector(settingsRequirementsSelector);
    const expertMode = useSelector(trickSemiLogicSelector);
    const consideredTricks = useSelector(trickSemiLogicTrickListSelector);

    useEffect(() => {
        const bitLogic = mergeRequirements(
            logic.numRequirements,
            logic.staticRequirements,
            settingsRequirements,
        );
        setAnalyzer(
            new TooltipComputer(
                logic,
                options,
                settings,
                expertMode,
                consideredTricks,
                bitLogic,
            ),
        );
        return () => {
            setAnalyzer((oldAnalyzer) => {
                oldAnalyzer?.destroy();
                return null;
            });
        };
    }, [
        settingsRequirements,
        logic,
        options,
        expertMode,
        consideredTricks,
        settings,
    ]);

    return <TooltipsContext value={analyzer}>{children}</TooltipsContext>;
}

/** Compute the tooltip expression for a given check. This will return undefined until results are available. */
export function useTooltipExpr(
    checkId: string,
    active = true,
): RootTooltipExpression | undefined {
    const store = useContext(TooltipsContext);
    const logic = useSelector(logicSelector);
    const getRequirementLogicalState = useSelector(
        getRequirementLogicalStateSelector,
    );

    const subscribe = useCallback(
        (callback: () => void) =>
            (active && store?.subscribe(checkId, callback)) || noop,
        [active, checkId, store],
    );
    const getSnapshot = useCallback(
        () => (active && store?.getSnapshot(checkId)) || undefined,
        [active, checkId, store],
    );
    const booleanExpr = useSyncExternalStore(subscribe, getSnapshot);

    return useMemo(
        () =>
            booleanExpr &&
            booleanExprToTooltipExpr(
                logic,
                booleanExpr,
                getRequirementLogicalState,
            ),
        [booleanExpr, logic, getRequirementLogicalState],
    );
}

export function useEntrancePath(checkId: string): string[] | undefined {
    const logicPathfinding = useSelector(inLogicPathfindingSelector);
    const optimisticPathfinding = useSelector(optimisticPathfindingSelector);
    const entranceRando = useSelector(settingSelector('randomize-entrances'));

    return useMemo(() => {
        if (entranceRando !== 'All') {
            return undefined;
        }

        const path =
            logicPathfinding?.[checkId] ?? optimisticPathfinding?.[checkId];
        if (!path) {
            return undefined;
        }
        const segments = [];
        let node: ExplorationNode | undefined = path;
        do {
            if (node.edge) {
                segments.push(node.edge);
            }
            node = node.parent;
        } while (node !== undefined);
        segments.push('Start');
        return segments.reverse();
    }, [checkId, entranceRando, logicPathfinding, optimisticPathfinding]);
}
