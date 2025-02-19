import { LogicalExpression } from '../logic/bitlogic/LogicalExpression';
import BooleanExpression, {
    type Item,
} from '../logic/booleanlogic/BooleanExpression';
import {
    booleanExprToLogicalExpr,
    parseExpression,
} from '../logic/booleanlogic/ExpressionParse';
import { dnfToRequirementExpr } from './worker/Algorithms';
import type { LeanLogic } from './worker/Types';

function stringifyExpression(expr: Item): string {
    if (BooleanExpression.isExpression(expr)) {
        return (
            '(' +
            expr.items
                .map(stringifyExpression)
                .join(expr.isAnd() ? ' & ' : ' | ') +
            ')'
        );
    }
    return expr;
}

function simplify(source: string): string {
    const items: string[] = [];
    const booleanExpression = parseExpression(source);
    let terms = booleanExprToLogicalExpr(booleanExpression, (text) => {
        const idx = items.indexOf(text);
        if (idx !== -1) {
            return idx;
        } else {
            items.push(text);
            return items.length - 1;
        }
    });

    const logic: LeanLogic = {
        allItems: items,
        impliedBy: {},
        itemBits: Object.fromEntries(items.map((i, idx) => [i, idx])),
    };

    terms = new LogicalExpression(terms).removeDuplicates().conjunctions;

    const simplified = dnfToRequirementExpr(logic, terms);
    return stringifyExpression(simplified);
}

// Nice
test('simplify1', () => {
    expect(
        simplify(
            '(Mitts & Bow) | (Mitts & Clawshots) | (Mitts & Slingshot) | (Mitts & Beetle) | (Bomb & Bow) | (Bomb & Clawshots) | (Bomb & Slingshot) | (Bomb & Beetle)',
        ),
    ).toMatchInlineSnapshot(
        `"((Mitts | Bomb) & (Bow | Clawshots | Slingshot | Beetle))"`,
    );
});

// Slightly less nice: These are equivalent
// * ((Mitts & (Bow | Clawshots | Slingshot | Beetle)) | (Bomb & (Bow | Slingshot)))
// * (Bow | Clawshots | Slingshot | Beetle) & (Mitts | (Bomb & (Bow | Slingshot)))
// * (((Bow | Slingshot) & (Mitts | Bomb)) | (Mitts & (Clawshots | Beetle)))
// But the second one is the most readable because our tooltips turn a top-level AND into multiple
// bullet points.
// The co-kernel-cube matrix looks something like this:
// |           | Mitts | Bow | Clawshots | Slingshot | Beetle | Bomb |
// |-----------|-------|-----|-----------|-----------|--------|------|
// | Bow       | 1     | 1   |           |           |        |      |
// | Mitts     |       |     | 1         | 1         | 1      | 1    |
// | Slingshot | 1     | 1   |           |           |        |      |
// | Bomb      |       |     | 1         |           | 1      |      |
//
// The prime rectangles here are:
// [Bow, Slingshot] x [Mitts, Bow]
// [Mitts, Bomb] x [Clawshots, Beetle]
// [Mitts] x [Clawshots, Slingshot, Beetle, Bomb]
// Clawshots and Beetle don't have rows because they don't correspond to a co-kernel since
// there's only one term that mentions them. So pulling `(Bow | Clawshots | Slingshot | Beetle)`
// out first is not something our algorithm knows how to do.
test('simplify2', () => {
    expect(
        simplify(
            '(Mitts & Bow) | (Mitts & Clawshots) | (Mitts & Slingshot) | (Mitts & Beetle) | (Bomb & Bow) | (Bomb & Slingshot)',
        ),
    ).toMatchInlineSnapshot(
        `"((Mitts & (Bow | Clawshots | Slingshot | Beetle)) | (Bomb & (Bow | Slingshot)))"`,
    );
});
