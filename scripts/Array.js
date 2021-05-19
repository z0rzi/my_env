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
export {};
//# sourceMappingURL=Array.js.map