export type Op = 'and' | 'or';

export type Item = BooleanExpression | string;

class BooleanExpression {
    type: Op;
    items: Item[];

    constructor(items: Item[], type: Op) {
        this.items = items;
        this.type = type;
    }

    static and(...items: Item[]) {
        return new BooleanExpression(items, 'and');
    }

    static or(...items: Item[]) {
        return new BooleanExpression(items, 'or');
    }

    isAnd() {
        return this.type === 'and';
    }

    isOr() {
        return this.type === 'or';
    }

    static isExpression(item: Item): item is BooleanExpression {
        return typeof item === 'object' && item instanceof BooleanExpression;
    }

    flatten(): BooleanExpression {
        const newItems = this.items.flatMap((item) => {
            if (!BooleanExpression.isExpression(item)) {
                return item;
            }
            const flatItem = item.flatten();
            if (flatItem.type === this.type || flatItem.items.length === 1) {
                return flatItem.items;
            }
            return flatItem;
        });

        if (
            newItems.length === 1 &&
            BooleanExpression.isExpression(newItems[0])
        ) {
            return newItems[0];
        }

        return new BooleanExpression(newItems, this.type);
    }

    simplify(): BooleanExpression {
        return this.flatten();
    }
}

export default BooleanExpression;
