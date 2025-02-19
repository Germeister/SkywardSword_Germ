const ONE = BigInt(1);
const ZERO = BigInt(0);

function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
    if (a.size > b.size) {
        const tmp = a;
        // eslint-disable-next-line no-param-reassign
        a = b;
        // eslint-disable-next-line no-param-reassign
        b = tmp;
    }
    return new Set([...a].filter((v) => b.has(v)));
}

function union<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a, ...b]);
}

/**
 * A fixed-size bit vector.
 */
export class BitVector {
    data: bigint;
    intSet: Set<number>;

    constructor();
    constructor(bits: bigint, intSet: Set<number>);

    constructor(bits?: bigint, intSet?: Set<number>) {
        this.data = bits ?? ZERO;
        this.intSet = intSet ?? new Set();
    }

    /** Sets the bit `bit` in this BitVector, if not already set. */
    setBit(bit: number): this {
        this.data |= ONE << BigInt(bit);
        this.intSet.add(bit);
        return this;
    }

    /** Clears the bit `bit` in this BitVector, if set. */
    clearBit(bit: number): this {
        if (this.intSet.has(bit)) {
            this.data = this.data - (ONE << BigInt(bit));
            this.intSet.delete(bit);
        }
        return this;
    }

    /** Creates a new BitVector consisting of the bits that are both in `this` and `other`. */
    and(other: BitVector) {
        return new BitVector(
            other.data & this.data,
            intersection(other.intSet, this.intSet),
        );
    }

    /** Creates a new BitVector consisting of the bits that are in `this` or in `other`. */
    or(other: BitVector) {
        return new BitVector(
            other.data | this.data,
            union(other.intSet, this.intSet),
        );
    }

    /** Returns true iff `bit` is set in this BitVector. */
    test(bit: number) {
        return this.intSet.has(bit);
    }

    /** Returns true iff all the bits in `this` are also set in `other`. */
    isSubsetOf(other: BitVector) {
        return (
            this.numSetBits <= other.numSetBits &&
            (this.data | other.data) === other.data
        );
    }

    /** Returns true iff all the bits in `this` are also set in `other` and the other way around. */
    equals(other: BitVector) {
        return this.data === other.data;
    }

    /**
     * slow
     */
    toString(domainSize: number) {
        let str = '';
        for (let bit = domainSize - 1; bit >= 0; bit--) {
            if (this.data & (ONE << BigInt(bit))) {
                str += '1';
            } else {
                str += '0';
            }
        }
        return str;
    }

    /** Returns a new BitVector with exactly the same bits set. */
    clone() {
        return new BitVector(this.data, new Set(this.intSet));
    }

    /** Returns true iff no bits are set. */
    isEmpty() {
        return this.numSetBits === 0;
    }

    /** Returns true iff there is a bit that's set in both `this` and `other`. */
    intersects(other: BitVector) {
        return Boolean(this.data & other.data);
    }

    /** Iterates over all set bits in this BitVector. */
    iter() {
        return this.intSet.values();
    }

    /** Assuming that this vector has a single set bit, returns it. */
    getSingleSetBit(): number {
        return this.intSet.values().next().value as number;
    }

    /** Returns the number of bits set in this BitVector. */
    get numSetBits() {
        return this.intSet.size;
    }
}
