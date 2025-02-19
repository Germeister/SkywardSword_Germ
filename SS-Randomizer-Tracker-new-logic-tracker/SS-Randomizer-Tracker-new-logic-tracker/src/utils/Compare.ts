/**
 * A function that can compare values as expected by JS Array.prototype.sort:
 *
 *  * A negative value indicates that a should come before b.
 *  * A positive value indicates that a should come after b.
 *  * Zero [or NaN] indicates that a and b are considered equal.
 */
export type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;
type CompareKey = undefined | number | string | boolean;

/** Turn a key extraction function into a comparison function for Array.prototype.sort */
export function compareBy<T>(fn: (arg: T) => CompareKey): Comparator<T> {
    return (a, b) => {
        const keyA = fn(a);
        const keyB = fn(b);
        if (keyA === keyB) {
            return 0;
        } else if (keyB === undefined) {
            return 1;
        } else if (keyA === undefined || keyA < keyB) {
            return -1;
        } else if (keyA > keyB) {
            return 1;
        }
        return 0;
    };
}

/** Chain two or more comparison functions. If the first returns 0 for equal, try the next one as a tiebreaker and so on. */
export function chainComparators<T>(...fns: Comparator<T>[]): Comparator<T> {
    return (a, b) => {
        for (const fn of fns) {
            const result = fn(a, b);
            if (result !== 0) {
                return result;
            }
        }
        return 0;
    };
}
