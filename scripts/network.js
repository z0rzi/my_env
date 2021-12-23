import { __awaiter } from "tslib";
import fetch from 'node-fetch';
import dns from 'dns';
export function getMyIp() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch('https://api.ipify.org?format=json').then(res => res.json());
        return res.ip;
    });
}
export function getMyLocation() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch('http://demo.ip-api.com/json/?fields=17&lang=en').then(res => res.json());
        return {
            country: res.country,
            city: res.city,
        };
    });
}
export function checkInternet() {
    return new Promise(resolve => {
        dns.lookup('google.com', function (err) {
            if (err && err.code == 'ENOTFOUND') {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}
//# sourceMappingURL=network.js.map