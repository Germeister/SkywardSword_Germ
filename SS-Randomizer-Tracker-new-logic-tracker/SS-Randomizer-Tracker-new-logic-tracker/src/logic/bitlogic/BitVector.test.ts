import { BitVector } from './BitVector';

test('basic tests', () => {
    const vec = new BitVector();
    vec.setBit(7);
    expect(vec.toString(8)).toBe('10000000');
    vec.setBit(6);
    expect(vec.toString(8)).toBe('11000000');
    vec.setBit(4);
    expect(vec.toString(8)).toBe('11010000');
    vec.clearBit(6);
    expect(vec.toString(8)).toBe('10010000');
});

test('or tests', () => {
    const vec = new BitVector();
    vec.setBit(7);

    const vec2 = new BitVector();
    vec2.setBit(7);
    vec2.setBit(3);
    expect(vec.or(vec2).toString(8)).toBe('10001000');
});
