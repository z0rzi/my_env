declare global {
    interface Array<T> {
        /** Only keeps one time each element */
        uniq: () => T[];

        /** sorts the array by alphabetical order */
        alphasort: (accessor: (v: T) => string) => T[];

        /** sorts the array by alphabetical order */
        asyncMap: <V>(mapFn: (elem: T) => Promise<V>) => Promise<V[]>;
    }
}

Array.prototype['uniq'] = function <T>() {
    return this.filter((val: T, idx: number, fullArray: T[]) => {
        const first = fullArray.indexOf(val);
        return first === idx;
    });
};

Array.prototype['alphasort'] = function <T>(
    accessor: (v: T) => string = v => String(v)
) {
    const arr = this as T[];
    arr.sort((a: T, b: T) => {
        const _a = accessor(a);
        const _b = accessor(b);
        if (_a < _b) return -1;
        if (_a > _b) return 1;
        return 0;
    });
    return arr;
};

Array.prototype['asyncMap'] = async function <V>(
    mapFn: (elem: unknown) => Promise<V>
): Promise<V[]> {
    const arr = this as Array<unknown>;
    const promises = [] as Promise<V>[];
    const out = [] as V[];

    // starting all the promises side by side
    for (const elem of arr) promises.push(mapFn(elem));

    // Waiting all the promises
    for (const p of promises) out.push(await p);

    return out;
};

export {};
