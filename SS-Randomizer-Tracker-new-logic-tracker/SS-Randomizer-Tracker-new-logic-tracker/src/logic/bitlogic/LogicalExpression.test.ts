import { BitVector } from './BitVector';
import { LogicalExpression } from './LogicalExpression';

test('dedup tests', () => {
    const vec = new BitVector();
    vec.setBit(7);

    const vec2 = new BitVector();
    vec.setBit(3);

    const vec3 = new BitVector();

    const expr = new LogicalExpression([vec, vec2]).or(vec3).removeDuplicates();
    expect(expr.isTriviallyTrue()).toBe(true);
});
