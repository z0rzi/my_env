var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
