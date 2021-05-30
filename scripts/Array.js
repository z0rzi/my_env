Array.prototype['uniq'] = function () {
    return this.filter((val, idx, fullArray) => {
        const first = fullArray.indexOf(val);
        return first === idx;
    });
};
Array.prototype['alphasort'] = function (accessor = v => String(v)) {
    const arr = this;
    arr.sort((a, b) => {
        const _a = accessor(a);
        const _b = accessor(b);
        if (_a < _b)
            return -1;
        if (_a > _b)
            return 1;
        return 0;
    });
    return arr;
};
Array.prototype['asyncMap'] = async function (mapFn) {
    const arr = this;
    const promises = [];
    const out = [];
    for (const elem of arr)
        promises.push(mapFn(elem));
    // starting all the promises side by side
    for (const elem of arr)
        promises.push(mapFn(elem));
    // Waiting all the promises
    for (const p of promises)
        out.push(await p);
    return out;
};
export {};
//# sourceMappingURL=Array.js.map