import { BitVector } from './BitVector';

/**
 * A logical expression in DNF (disjunctive normal form).
 */
export class LogicalExpression {
    conjunctions: BitVector[];

    /** Creates an expression that always evaluates to false. */
    static false() {
        return new LogicalExpression([]);
    }

    /** Creates an expression that always evaluates to true. */
    static true() {
        return new LogicalExpression([new BitVector()]);
    }

    /** Constructs an expression from the given BitVectors describing a DNF expression. */
    constructor(conjs: BitVector[]) {
        this.conjunctions = conjs;
    }

    /**
     * Constructs an expression that evaluates to true if `this`
     * evaluates to true or `other` evaluates to true.
     */
    or(other: LogicalExpression | BitVector) {
        if (other instanceof BitVector) {
            return new LogicalExpression([...this.conjunctions, other]);
        } else {
            return new LogicalExpression([
                ...this.conjunctions,
                ...other.conjunctions,
            ]);
        }
    }

    /**
     * Constructs an expression that evaluates to true if `this`
     * evaluates to true and `other` evaluates to true.
     */
    and(other: LogicalExpression | BitVector) {
        if (other instanceof BitVector) {
            return new LogicalExpression(andToDnf2(this.conjunctions, [other]));
        }

        if (this.isTriviallyFalse() || other.isTriviallyFalse()) {
            return LogicalExpression.false();
        }
        return new LogicalExpression(
            andToDnf2(this.conjunctions, other.conjunctions),
        );
    }

    /**
     * From each conjunction in the DNF, removes `drop` unless the
     * `unless` bit is set.
     */
    drop_unless(drop: number, unless: number) {
        return new LogicalExpression(
            this.conjunctions.map((c) =>
                c.test(unless) ? c : c.clone().clearBit(drop),
            ),
        );
    }

    /**
     * Simplifies the expression by removing disjuncts that are implied by a another disjunct.
     */
    removeDuplicates() {
        const terms: BitVector[] = [];
        nextTerm: for (let i = 0; i < this.conjunctions.length; i++) {
            const candidate = this.conjunctions[i];
            const toRemove: number[] = [];
            for (const [existingIdx, existing] of terms.entries()) {
                if (existing.isSubsetOf(candidate)) {
                    // existing requires fewer or equal things than candidate
                    continue nextTerm;
                } else if (candidate.isSubsetOf(existing)) {
                    toRemove.push(existingIdx);
                }
            }

            for (let j = toRemove.length - 1; j >= 0; j--) {
                const idx = toRemove[j];
                // remove element at idx without shifting the rest by
                // swapping if needed
                if (idx === terms.length - 1) {
                    terms.pop();
                } else {
                    terms[idx] = terms.pop()!;
                }
            }
            terms.push(candidate);
        }
        return new LogicalExpression(terms);
    }

    /**
     * Computes .or, and returns true iff it resulted in
     * the terms of `this` changing.
     */
    orExtended(other: LogicalExpression) {
        const self: BitVector[] = [...this.conjunctions];
        const filteredOther: BitVector[] = [];
        let useful = false;

        const otherTerms = other.conjunctions;
        nextTerm: for (let i = 0; i < otherTerms.length; i++) {
            const candidate = otherTerms[i];
            for (let j = 0; j < self.length; j++) {
                const existing = self[j];
                if (existing.isSubsetOf(candidate)) {
                    continue nextTerm;
                }
            }

            filteredOther.push(candidate);
            useful = true;
        }
        return [
            useful,
            new LogicalExpression([...self, ...filteredOther]),
        ] as const;
    }

    /**
     * Evaluates the expression assuming the variables in `vec` are true.
     */
    eval(vec: BitVector) {
        return this.conjunctions.some((c) => c.isSubsetOf(vec));
    }

    /**
     * Whether the expression always definitely evaluates to false.
     */
    isTriviallyFalse() {
        return this.conjunctions.length === 0;
    }

    /**
     * Whether the expression always definitely evaluates to true.
     */
    isTriviallyTrue() {
        return (
            this.conjunctions.length > 0 &&
            this.conjunctions.some((c) => c.isEmpty())
        );
    }

    /**
     * Returns a deep clone of this expression
     */
    clone() {
        return new LogicalExpression(this.conjunctions.map((c) => c.clone()));
    }
}

/**
 * An optimized (unrolled) version of `andToDnf` for AND-ing exactly two expressions.
 */
function andToDnf2(left: BitVector[], right: BitVector[]): BitVector[] {
    const newExpr = [];
    for (const l of left) {
        for (const r of right) {
            newExpr.push(l.or(r));
        }
    }
    return newExpr;
}

export function andToDnf(arr: BitVector[][]): BitVector[] {
    if (arr.length === 2) {
        return andToDnf2(arr[0], arr[1]);
    }
    const newExpr = [];
    for (const tuple of cartesianProduct(...arr)) {
        const newVec = tuple.reduce((acc, val) => acc.or(val), new BitVector());
        newExpr.push(newVec);
    }
    return newExpr;
}

function cartesianProduct<T>(...allEntries: T[][]): T[][] {
    return allEntries.reduce<T[][]>(
        (results, entries) =>
            results
                .map((result) => entries.map((entry) => result.concat([entry])))
                .reduce((subResults, result) => subResults.concat(result), []),
        [[]],
    );
}
