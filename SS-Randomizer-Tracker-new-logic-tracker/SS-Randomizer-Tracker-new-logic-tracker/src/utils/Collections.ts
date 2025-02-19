// eslint-disable-next-line no-restricted-imports
import { mapValues as mapValuesEsTk } from 'es-toolkit';

const EMPTY_ARRAY: [] = [];

export function emptyArray<T>(): T[] {
    return EMPTY_ARRAY;
}

export function isEmpty<T extends object | undefined | null>(obj: T) {
    if (!obj) {
        return true;
    }

    for (const _key in obj) {
        return false;
    }
    return true;
}

/** Like es-toolkit/mapValues, but uses correct key typing */
export function mapValues<T extends object, K extends keyof T & string, V>(
    object: T,
    getNewValue: (value: T[keyof T], key: K) => V,
) {
    return mapValuesEsTk(object, getNewValue);
}
