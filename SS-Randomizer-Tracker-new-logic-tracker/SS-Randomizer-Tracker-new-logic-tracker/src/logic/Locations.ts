import type { ExitRule } from './Entrances';
import type { LogicalCheck } from './Logic';

export interface CheckGroup {
    /**
     * A flat list of all checks in this group. May include some
     * non-progress checks, e.g. banned gratitude crystals.
     */
    list: string[];
    /** The number of progress checks, excluding banned crystals. */
    numTotal: number;
    /**
     * The number of uncollected progress checks that are currently
     * considered in logic.
     */
    numAccessible: number;
    /** The number of uncollected progress checks. */
    numRemaining: number;
}

export interface HintRegion<N extends string = string> {
    name: N;
    nonProgress: boolean;
    hidden: boolean;

    checks: CheckGroup;
    extraLocations: {
        tr_cube?: CheckGroup;
        loose_crystal?: CheckGroup;
        gossip_stone?: CheckGroup;
        exits?: CheckGroup;
    };
}

export type LogicalState = 'outLogic' | 'inLogic' | 'semiLogic' | 'trickLogic';

export interface Check {
    type: LogicalCheck['type'] | 'exit';
    checkId: string;
    checkName: string;
    logicalState: LogicalState;
    checked: boolean;
}

interface AbstractExitMapping {
    exit: {
        id: string;
        name: string;
    };
    entrance:
        | {
              id: string;
              name: string;
              region: string;
          }
        | undefined;
    canAssign: boolean;
    rule: ExitRule;
}

export interface ReadOnlyExitMapping extends AbstractExitMapping {
    canAssign: false;
    rule: ExitRule & {
        type: 'vanilla' | 'follow' | 'lmfSecondExit' | 'linked';
    };
}

export interface AssignableExitMapping extends AbstractExitMapping {
    canAssign: true;
    rule: ExitRule & { type: 'random' };
}

export type ExitMapping = ReadOnlyExitMapping | AssignableExitMapping;

export const dungeonNames = [
    'Skyview',
    'Earth Temple',
    'Lanayru Mining Facility',
    'Ancient Cistern',
    'Sandship',
    'Fire Sanctuary',
    'Sky Keep',
] as const;

export type DungeonName = (typeof dungeonNames)[number];
export type RegularDungeon = Exclude<DungeonName, 'Sky Keep'>;
export function isDungeon(id: string): id is DungeonName {
    const names: readonly string[] = dungeonNames;
    return names.includes(id);
}

export function isRegularDungeon(id: string): id is RegularDungeon {
    return isDungeon(id) && id !== 'Sky Keep';
}
