
declare global {
    interface Array<T> {
        /** Only keeps one time each element */
        uniq: () => T[];

        /** sorts the array by alphabetical order */
        alphasort: (accessor: (v: T) => string) => T[];
    }
}

Array.prototype['uniq'] = function<T> () {
    return this.filter((val: T, idx: number, fullArray: T[]) => {
        const first = fullArray.indexOf(val);
        return first === idx;
    });
};

Array.prototype['alphasort'] = function<T> (accessor: (v: T) => string = v => String(v)) {
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

export {};
