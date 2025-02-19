import { appDebug } from '../../utils/Debug';
import { BitVector } from './BitVector';
import { LogicalExpression } from './LogicalExpression';

/**
 * Requirements are a partial logic that makes statements about the present bits
 * and no statements about absent bits.
 */
export type Requirements = Record<number, LogicalExpression>;
/**
 * A BitLogic models a least fixed-point logic (LFP).
 * Since every LogicalExpression can only mention terms positively
 * (no negation, no quantifiers) this least fixed-point always exists.
 */
export type BitLogic = LogicalExpression[];

export function mergeRequirements(
    numBits: number,
    ...reqs: Requirements[]
): BitLogic {
    const requirements: LogicalExpression[] = [];
    const mergedRequirements: Requirements = {};
    Object.assign(mergedRequirements, ...reqs);
    for (let i = 0; i < numBits; i++) {
        requirements.push(mergedRequirements[i] ?? LogicalExpression.false());
    }
    return requirements;
}

/*
 * Returns the least fixed-point of the given requirements,
 * which can be interpreted as the logical result of the given requirements.
 * This is a BitVector from which no new facts can be derived.
 */
export function computeLeastFixedPoint(
    /** Why is this being computed? For logging */
    reason: string,
    /** The BitLogic describing the logic program (requirements). */
    logic: BitLogic,
    /**
     * To resume computation from an earlier result after adding facts to `additionalRequirements`
     * (concretely: semilogic requirements), pass startingBits. Purely a performance optimization.
     */
    startingBits?: BitVector,
) {
    // This is an extremely simple iterate-to-fixpoint solver in O(n^2).
    // There are better algorithms but this usually converges after
    // about 15 rounds.
    const bits = startingBits?.clone() ?? new BitVector();
    let changed = true;
    let iterations = 0;
    const start = performance.now();
    while (changed) {
        changed = false;
        for (const [idx, expr] of logic.entries()) {
            const evaluate = (e: LogicalExpression) => {
                const val = e.eval(bits);
                if (val) {
                    bits.setBit(idx);
                    return true;
                }
                return false;
            };

            if (expr.isTriviallyFalse()) {
                continue;
            } else if (!bits.test(idx)) {
                const didChange = evaluate(expr);
                changed ||= didChange;
            }
        }
        iterations++;
    }

    appDebug(
        reason,
        'fixpoint iteration took',
        performance.now() - start,
        'ms for',
        iterations,
        'iterations',
    );

    return bits;
}

export function removeDuplicates(logic: BitLogic) {
    for (const [idx, expr] of logic.entries()) {
        if (expr.conjunctions.length >= 2) {
            logic[idx] = expr.removeDuplicates();
        }
    }
}

/**
 * Unifies non-opaque requirements if they directly imply each other. This is mostly
 * for simplifying clusters like the Sky, where there are lots of areas that are
 * all equally accessible as long as you're somewhere in the sky. This means one of
 * the unified areas will only have a single bit requirement, which can be inlined later.
 *
 * Returns true iff any simplifications have been made.
 */
export function unifyRequirements(
    opaqueBits: BitVector,
    requirements: LogicalExpression[],
) {
    // First, an O(n) scan to rule out expressions that are definitely not eligible
    const unificationCandidates: number[][] = requirements.map(() => []);
    for (const [idx, expr] of requirements.entries()) {
        if (opaqueBits.test(idx)) {
            continue;
        }
        for (const conj of expr.conjunctions) {
            if (conj.numSetBits === 1) {
                const bit = conj.getSingleSetBit();
                if (bit === idx || opaqueBits.test(bit)) {
                    continue;
                }
                unificationCandidates[bit].push(idx);
            }
        }
    }

    let simplified = false;
    for (let a = 0; a < requirements.length; a++) {
        const targetList = unificationCandidates[a];
        for (const b of targetList) {
            if (tryUnifyEquivalent(requirements, a, b)) {
                simplified = true;
            }
        }
    }

    return simplified;
}

/**
 * Check if:
 *  z <= a
 *  a <= b | x
 *  b <= a | y
 * Rewrite to:
 *  z <= a
 *  a <= b,
 *  b <= x | y,
 * This breaks a cycle between `a` and `b`, and any dependencies on `a`
 * can be rewritten to depend on `b` in a later shallowSimplify call.
 */
function tryUnifyEquivalent(
    requirements: LogicalExpression[],
    a: number,
    b: number,
) {
    const implA = requirements[a];
    const implB = requirements[b];

    if (implA.conjunctions.length < 2 || implB.conjunctions.length < 2) {
        return false;
    }

    const bImpliesAIndex = implA.conjunctions.findIndex(
        (cA) => cA.numSetBits === 1 && cA.test(b),
    );
    if (bImpliesAIndex === -1) {
        return false;
    }

    const aImpliesBIndex = implB.conjunctions.findIndex(
        (cB) => cB.numSetBits === 1 && cB.test(a),
    );
    if (aImpliesBIndex === -1) {
        return false;
    }

    // Copy reqs from a to b
    const implACon = implA.conjunctions.slice();
    const bReqVec = implACon.splice(bImpliesAIndex, 1);
    for (const cn of implACon) {
        requirements[b] = requirements[b].or(cn);
    }
    requirements[a] = new LogicalExpression(bReqVec);

    return true;
}

/**
 * Shallow simplification "inlines" non-opaque requirements that themselves only consist
 * of at most one conjunction into upstream conjunctions. A DNF requirement with zero
 * conjunctions is always False, so any conjunctions it appears in can be dropped,
 * while a DNF with exactly one conjunction can be inlined.
 *
 * Returns true iff any simplifications could be made.
 *
 *
 * E.g:
 *   a <= b&c | f | d
 *   b <= <false>
 *   d <= e
 *   f <= g&h
 * Rewrite to:
 *   a <= g&h | e
 *   b <= <false>
 *   d <= e
 *   f <= g&h
 */
export function shallowSimplify(opaqueBits: BitVector, requirements: BitLogic) {
    const inliningCandidates = new BitVector();

    let simplified = false;

    for (let item = 0; item < requirements.length; item++) {
        if (
            !opaqueBits.test(item) &&
            requirements[item].conjunctions.length <= 1
        ) {
            inliningCandidates.setBit(item);
        }
    }

    for (const [idx, expr] of requirements.entries()) {
        if (expr.conjunctions.length >= 30) {
            continue;
        }
        let newExpr = LogicalExpression.false();
        for (const conj of expr.conjunctions) {
            if (conj.intersects(inliningCandidates)) {
                simplified = true;
                let newItems = new BitVector();
                let skip = false;
                for (const reqItem of conj.iter()) {
                    if (!inliningCandidates.test(reqItem)) {
                        newItems.setBit(reqItem);
                    } else {
                        const revealed = requirements[reqItem];

                        if (revealed.isTriviallyTrue()) {
                            continue;
                        }

                        if (revealed.isTriviallyFalse()) {
                            skip = true;
                            break;
                        }
                        newItems = newItems.or(revealed.conjunctions[0]);
                    }
                }
                if (!skip && !newItems.test(idx)) {
                    newExpr = newExpr.or(newItems);
                }
            } else {
                newExpr = newExpr.or(conj);
            }
        }

        requirements[idx] = newExpr;
    }
    return simplified;
}

/**
 * Bottom-up propagation propagates disjuncts that consist of completely
 * opaque bits until a fixpoint is reached.
 *
 * This is basically symbolic logical state computation - but instead
 * of computing boolean logical state bottom-up, we compute requirements
 * bottom-up, which a fixpoint being reached if requirements don't change anymore.
 *
 * Previously the use case was implemented using a top-down algorithm, but that
 * ended up with unpredictable performance due to heuristics. Bottom-up performs well
 * and computes all tooltips very quickly (<250ms on my machine, which is not
 * quite fast enough to move it to the main thread, but pretty hard to beat).
 *
 * The reason I investigated replacing the top-down algorithm with a bottom-
 * up algorithm is my hope that this approach will adapt better to alternative
 * or future logic implementations that don't map everything to bits, e.g. lepe's
 * Rust logic experiments that literally traverse an area graph. In that case
 * "opaque bits" are ::Item requirements, propagation happens through area exits,
 * ::Event requirements and ::Area requirements, and the keys in our lookup are Event
 * IDs and Area+ToD keys. A fixpoint is then reached if we can't find new paths to Areas
 * and Events, and after that we can inline them into the check requirements since
 * checks cannot be a further dependency. The main challenge will be having a
 * normalized requirements form that you can quickly use to identify whether there is
 * a satisfiable option and figure out if a fixpoint is reached, since
 * expression equality really wants a normal form.
 */
export function bottomUpTooltipPropagation(
    opaqueBits: BitVector,
    requirements: BitLogic,
) {
    // First, we split our requirements into disjuncts that contain non-opaque
    // terms and disjuncts that contain no non-opaque terms.
    const originalRequirements = requirements.map(
        (expr) =>
            new LogicalExpression(
                expr.conjunctions.filter((c) => !c.isSubsetOf(opaqueBits)),
            ),
    );

    const propagationCandidates = new BitVector();

    for (const [idx, expr] of requirements.entries()) {
        const newExpr = new LogicalExpression(
            expr.conjunctions.filter((c) => c.isSubsetOf(opaqueBits)),
        );
        requirements[idx] = newExpr;
        if (!newExpr.isTriviallyFalse() || opaqueBits.test(idx)) {
            propagationCandidates.setBit(idx);
        }
    }

    // Invariant: Terms in `requirements` contain no non-opaque bits
    // Invariant: For every requirement in `requirements` that is opaque or
    // isn't trivially false, `propagationCandidates` has the corresponding bit set.

    let changed = true;
    let rounds = 0;

    let recentlyChanged: BitVector | undefined = undefined;

    while (changed) {
        rounds++;
        changed = false;
        const thisRoundChanged = new BitVector();

        const interestingCandidates = recentlyChanged
            ? recentlyChanged.and(propagationCandidates)
            : propagationCandidates;

        // Repeatedly apply the "rules" to further propagate
        // requirements
        for (const [idx, expr] of originalRequirements.entries()) {
            // If something already requires Nothing, we don't even need to
            // bother with alternative ways to fulfill this requirement
            if (requirements[idx].isTriviallyTrue()) {
                continue;
            }

            let additionalTerms = LogicalExpression.false();

            for (const conj of expr.conjunctions) {
                // We can only propagate if all mentioned bits are either opaque or refer
                // to an expression where we've found at least one way for it to be satisfied.
                // If a non-opaque bit in there had no propagated requirements yet, `toPropagate`
                // would end up being False and the whole thing would be pointless.
                // Additionally, as an optimization, after the first round we only look at
                // terms we updated last round, to reduce the number operations that definitely
                // won't cause an update.
                if (
                    conj.isSubsetOf(propagationCandidates) &&
                    conj.intersects(interestingCandidates)
                ) {
                    const newItems = new BitVector();
                    let toPropagate = LogicalExpression.true();
                    for (const reqBit of conj.iter()) {
                        if (opaqueBits.test(reqBit)) {
                            newItems.setBit(reqBit);
                        } else {
                            const revealed = requirements[reqBit];
                            toPropagate = toPropagate
                                .and(revealed)
                                .removeDuplicates();
                        }
                    }

                    // We record all propagated possibilities in additionalTerms, so that
                    // below we can check if any of the additional terms are useful.
                    for (const term of toPropagate.conjunctions) {
                        additionalTerms = additionalTerms.or(term.or(newItems));
                    }
                }
            }

            const [useful, newExpr] =
                requirements[idx].orExtended(additionalTerms);
            if (useful) {
                thisRoundChanged.setBit(idx);
                changed = true;
                requirements[idx] = newExpr.removeDuplicates();
                propagationCandidates.setBit(idx);
            }
        }

        recentlyChanged = thisRoundChanged;
    }

    // We've reached a fixed point, which means we cannot find any new paths
    // in our requirement graph. So our output requirements now contain all
    // possible paths.

    appDebug('bottom-up tooltip requirements took', rounds, 'rounds');
}
