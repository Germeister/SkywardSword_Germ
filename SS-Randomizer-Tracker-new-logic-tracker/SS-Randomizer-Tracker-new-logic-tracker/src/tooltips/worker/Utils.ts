import { BitVector } from '../../logic/bitlogic/BitVector';
import { LogicalExpression } from '../../logic/bitlogic/LogicalExpression';
import BooleanExpression, {
    type Item,
} from '../../logic/booleanlogic/BooleanExpression';
import type { SerializedBooleanExpression, SerializedItem } from './Types';

export function deserializeLogicalExpression(
    expr: number[][],
): LogicalExpression {
    const terms = [];
    for (const conj of expr) {
        const vec = new BitVector();
        for (const bit of conj) {
            vec.setBit(bit);
        }
        terms.push(vec);
    }
    return new LogicalExpression(terms);
}

export function serializeLogicalExpression(
    expr: LogicalExpression,
): number[][] {
    return expr.conjunctions.map((c) => [...c.iter()]);
}

export function serializeBooleanExpression(
    expr: BooleanExpression,
): SerializedBooleanExpression {
    return serializeBooleanItem(expr) as SerializedBooleanExpression;
}

function serializeBooleanItem(item: Item): SerializedItem {
    if (BooleanExpression.isExpression(item)) {
        switch (item.type) {
            case 'and':
                return {
                    type: 'and',
                    items: item.items.map(serializeBooleanItem),
                };
            case 'or':
                return {
                    type: 'or',
                    items: item.items.map(serializeBooleanItem),
                };
        }
    } else {
        return item;
    }
}

export function deserializeBooleanExpression(
    expr: SerializedBooleanExpression,
): BooleanExpression {
    return new BooleanExpression(
        expr.items.map((i) =>
            typeof i === 'string' ? i : deserializeBooleanExpression(i),
        ),
        expr.type,
    );
}
