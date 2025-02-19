import { appError } from '../utils/Debug';
import type { Requirements } from './bitlogic/BitLogic';
import { BitVector } from './bitlogic/BitVector';
import { LogicalExpression } from './bitlogic/LogicalExpression';

const daySuffix = '_DAY';
const nightSuffix = '_NIGHT';

function makeDay(loc: string) {
    return `${loc}${daySuffix}`;
}

function makeNight(loc: string) {
    return `${loc}${nightSuffix}`;
}

/**
 * A helper class for bridging the stringly-typed requirements to bit logic.
 * Used when initially building logic and when mapping tracker state to logic.
 */
export class LogicBuilder {
    itemList: string[];
    itemLookup: Record<string, number>;

    requirements: Requirements;

    constructor(
        allItems: string[],
        itemLookup: Record<string, number>,
        requirements: Requirements,
    ) {
        this.itemList = allItems;
        this.itemLookup = itemLookup;
        this.requirements = requirements;
    }

    /** A logical expression that always evaluates to true. */
    true(): LogicalExpression {
        return LogicalExpression.true();
    }

    /** A logical expression that always evaluates to false. */
    false(): LogicalExpression {
        return LogicalExpression.false();
    }

    /** A logical expression that evaluates to true iff `item` is true. */
    singleBit(item: string): LogicalExpression {
        return new LogicalExpression([new BitVector().setBit(this.bit(item))]);
    }

    /** Sets the requirement for `target` to `rhs`.*/
    set(target: string, rhs: LogicalExpression) {
        const bit = this.bit(target);
        if (bit !== undefined) {
            if (this.requirements[bit]) {
                appError('overwriting item', target);
            }
            this.requirements[bit] = rhs;
        } else {
            appError('unknown item', target);
        }
    }

    /** Sets the requirement for `target` to `rhs`, ignoring the error if it doesn't exist */
    trySet(target: string, rhs: LogicalExpression) {
        const bit = this.bit(target);
        if (bit !== undefined) {
            if (this.requirements[bit]) {
                appError('overwriting item', target);
            }
            this.requirements[bit] = rhs;
        }
    }

    /** Adds the `rhs` expression as an alternative to the `target`. */
    addAlternative(target: string, rhs: LogicalExpression) {
        const bit = this.bit(target);
        this.requirements[bit] = (this.requirements[bit] ?? this.false()).or(
            rhs,
        );
    }

    /** Gets the bit index for the `item`. */
    bit(item: string): number {
        return this.itemLookup[item];
    }

    /** Add the "logical day" suffix to an item. */
    day(item: string) {
        const d = makeDay(item);
        if (this.bit(d) === undefined) {
            appError('unknown item', d);
        }
        return d;
    }

    /** Add the "logical night" suffix to an item. */
    night(item: string) {
        const d = makeNight(item);
        if (this.bit(d) === undefined) {
            appError('unknown item', d);
        }
        return d;
    }
}
