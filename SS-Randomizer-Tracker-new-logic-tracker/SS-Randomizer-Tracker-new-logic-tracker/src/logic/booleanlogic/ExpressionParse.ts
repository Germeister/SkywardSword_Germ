import { compact } from 'es-toolkit';
import { BitVector } from '../bitlogic/BitVector';
import { andToDnf } from '../bitlogic/LogicalExpression';
import BooleanExpression, { type Item } from './BooleanExpression';

export function parseExpression(expression: string) {
    return booleanExpressionForTokens(splitExpression(expression));
}

function splitExpression(expression: string) {
    return compact(
        expression.split(/\s*([(&|)])\s*/g).map((part) => part.trim()),
    );
}

function booleanExpressionForTokens(
    expressionTokens: string[],
): BooleanExpression {
    const itemsForExpression = [];
    let expressionTypeToken;
    while (expressionTokens.length) {
        const currentToken = expressionTokens.shift()!;
        if (currentToken === '&' || currentToken === '|') {
            expressionTypeToken = currentToken;
        } else if (currentToken === '(') {
            const childExpression =
                booleanExpressionForTokens(expressionTokens);
            itemsForExpression.push(childExpression);
        } else if (currentToken === ')') {
            break;
        } else {
            itemsForExpression.push(currentToken);
        }
    }
    if (expressionTypeToken === '|') {
        return BooleanExpression.or(...itemsForExpression);
    }
    return BooleanExpression.and(...itemsForExpression);
}

export function booleanExprToLogicalExpr(
    expr: Item,
    lookup: (text: string) => number,
): BitVector[] {
    if (BooleanExpression.isExpression(expr)) {
        switch (expr.type) {
            case 'or':
                return expr.items.flatMap((item) =>
                    booleanExprToLogicalExpr(item, lookup),
                );
            case 'and': {
                const mapped = expr.items.map((i) =>
                    booleanExprToLogicalExpr(i, lookup),
                );
                return andToDnf(mapped);
            }
            default: {
                throw new Error('unreachable');
            }
        }
    }

    if (expr === 'True') {
        return [new BitVector()];
    } else if (expr === 'False') {
        return [];
    } else {
        const bit_idx = lookup(expr);
        return [new BitVector().setBit(bit_idx)];
    }
}
