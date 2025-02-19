import { pick } from 'es-toolkit';
import type { Logic } from '../logic/Logic';
import { getTooltipOpaqueBits } from '../logic/TrackerModifications';
import type { BitLogic } from '../logic/bitlogic/BitLogic';
import BooleanExpression from '../logic/booleanlogic/BooleanExpression';
import type { OptionDefs, TypedOptions } from '../permalink/SettingsTypes';
import type { WorkerRequest, WorkerResponse } from './worker/Types';
import {
    deserializeBooleanExpression,
    serializeLogicalExpression,
} from './worker/Utils';

/**
 * The TooltipComputer acts as:
 * * A cache for computed tooltip expressions,
 * * A task queue for the tooltip computation worker, and
 * * A subscribeable store for tooltip components to request tooltip computations.
 */
export class TooltipComputer {
    subscriptions: Set<{ checkId: string; callback: () => void }>;
    results: Record<string, BooleanExpression>;

    isWorking: boolean;
    cleanup: () => void;
    worker: Worker | undefined;

    constructor(
        logic: Logic,
        options: OptionDefs,
        settings: TypedOptions,
        expertMode: boolean,
        trickLogicTricks: Set<string>,
        requirements: BitLogic,
    ) {
        this.subscriptions = new Set();
        this.results = {};
        this.isWorking = false;
        const opaqueBits = getTooltipOpaqueBits(
            logic,
            options,
            settings,
            expertMode,
            trickLogicTricks,
        );

        const { worker, cleanup } = createWorker();
        this.worker = worker;
        this.cleanup = cleanup;

        worker.postMessage({
            type: 'initialize',
            opaqueBits: [...opaqueBits.iter()],
            requirements: requirements.map(serializeLogicalExpression),
            logic: pick(logic, ['allItems', 'itemBits', 'impliedBy']),
        } satisfies WorkerRequest);
        worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
            this.acceptTaskResult(
                ev.data.checkId,
                deserializeBooleanExpression(ev.data.expression),
            );
            this.isWorking = false;
            this.checkForTask();
        };
    }

    notifyAll() {
        for (const entry of this.subscriptions.keys()) {
            entry.callback();
        }
    }

    notify(check: string) {
        for (const entry of this.subscriptions.keys()) {
            if (entry.checkId === check) {
                entry.callback();
            }
        }
    }

    subscribe(checkId: string, callback: () => void) {
        const entry = { checkId, callback };
        this.subscriptions.add(entry);
        this.checkForTask();
        return () => this.subscriptions.delete(entry);
    }

    getSnapshot(checkId: string): BooleanExpression | undefined {
        return this.results[checkId];
    }

    destroy() {
        this.cleanup();
        this.worker = undefined;
    }

    getNextTask() {
        for (const { checkId } of this.subscriptions.keys()) {
            if (!this.results[checkId]) {
                return { checkId };
            }
        }
        return undefined;
    }

    acceptTaskResult(checkId: string, result: BooleanExpression) {
        this.results[checkId] = result;
        this.notify(checkId);
    }

    checkForTask() {
        if (this.isWorking || !this.worker) {
            return;
        }
        const task = this.getNextTask();
        if (!task) {
            return;
        }
        this.isWorking = true;
        this.worker.postMessage({
            type: 'analyze',
            checkId: task.checkId,
        } satisfies WorkerRequest);
    }
}

function createWorker() {
    const worker = new Worker(new URL('./worker/Worker', import.meta.url), {
        type: 'module',
    });

    const cleanup = () => {
        worker.terminate();
    };

    return { worker, cleanup };
}
