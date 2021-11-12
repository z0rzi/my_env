import { __awaiter } from "tslib";
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
Array.prototype['asyncMap'] = function (mapFn) {
    return __awaiter(this, void 0, void 0, function* () {
        const arr = this;
        const promises = [];
        const out = [];
        // starting all the promises side by side
        for (const elem of arr)
            promises.push(mapFn(elem));
        // Waiting all the promises
        for (const p of promises)
            out.push(yield p);
        return out;
    });
};
Array.prototype['asyncFilter'] = function (mapFn) {
    return __awaiter(this, void 0, void 0, function* () {
        const arr = this;
        const out = [];
        // starting all the promises side by side
        const promises = arr.map(elem => mapFn(elem));
        // Waiting all the promises
        let i = 0;
        for (const p of promises) {
            if (yield p)
                out.push(arr[i]);
            i++;
        }
        return out;
    });
};
//# sourceMappingURL=Array.js.map