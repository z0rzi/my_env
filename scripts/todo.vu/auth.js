import { __awaiter } from "tslib";
const EMAIL = 'baptiste.zorzi@gmail.com';
const PASSWORD = 't0d0P4ss/';
import fetch from 'node-fetch';
import fs from 'fs';
let COOKIES = {};
let CSRF_TOKEN = '';
function interceptCookies(res) {
    res.headers.forEach((headVal, headKey) => {
        if (headKey === 'set-cookie') {
            const [cookieKey, cookeyVal] = parseCookie(headVal);
            COOKIES[cookieKey] = cookeyVal;
        }
    });
    return res;
}
function parseCookie(raw) {
    return raw.replace(/;.*$/, '').split(/=/);
}
export function headers(opts = {}, additionalHeaders = {}) {
    opts = Object.assign({
        with_csrf_token: false,
    }, opts);
    if (opts.with_csrf_token) {
        additionalHeaders['x-csrf-token'] = CSRF_TOKEN;
        if ('kitovu_auth_tkt' in COOKIES) {
            // we are logged in
            additionalHeaders['origin'] = 'https://zorzi.todo.vu';
        }
        else {
            // we are not logged in
            additionalHeaders['origin'] = 'https://todo.vu';
        }
    }
    const cookies = ['kitovu_code_version=5.17.1', 'kitovu_account_level=solo'];
    Object.entries(COOKIES).forEach(([k, v]) => {
        cookies.push(`${k}=${v}`);
    });
    return Object.assign({
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9,fr;q=0.8',
        'content-type': 'application/json;charset=utf-8',
        'accept-encoding': 'gzip, deflate, br',
        // 'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
        // 'x-app-instance': 'Netscape-1632751275-62720',
        mode: 'cors',
        'cache-control': 'max-age=0',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        authority: 'todo.vu',
        cookie: cookies.join('; '),
    }, additionalHeaders);
}
function refreshCsrfToken() {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://todo.vu/login')
            .then(interceptCookies)
            .then(r => r.text())
            .then(res => {
            CSRF_TOKEN = res.match(/csrf_token\s*=\s*["'](.*?)['"]/)[1];
            return CSRF_TOKEN;
        })
            .catch(() => {
            throw new Error('Could not retrieve CSRF token...');
        });
    });
}
function saveProfile(token) {
    fs.writeFileSync('/tmp/.todo.token', token);
    fs.writeFileSync('/tmp/.todo.cookies', JSON.stringify(COOKIES));
}
function loadToken() {
    if (!fs.existsSync('/tmp/.todo.token'))
        return;
    CSRF_TOKEN = fs.readFileSync('/tmp/.todo.token').toString();
}
function loadCookies() {
    if (!fs.existsSync('/tmp/.todo.cookies'))
        return;
    COOKIES = JSON.parse(fs.readFileSync('/tmp/.todo.cookies').toString());
}
export function login(email = EMAIL, pass = PASSWORD, force = false) {
    return __awaiter(this, void 0, void 0, function* () {
        loadToken();
        loadCookies();
        if (!CSRF_TOKEN || !Object.keys(COOKIES).length) {
            yield refreshCsrfToken();
            const form = new URLSearchParams();
            form.append('csrf_token', CSRF_TOKEN);
            form.append('email', email);
            form.append('password', pass);
            yield fetch('https://todo.vu/login', {
                method: 'post',
                body: form.toString(),
                redirect: 'manual',
                headers: headers({ with_csrf_token: true }, {
                    'content-type': 'application/x-www-form-urlencoded',
                }),
            }).then(interceptCookies);
            yield getAppSettings();
        }
    });
}
function getAppSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://zorzi.todo.vu/app-settings', {
            headers: headers({ with_csrf_token: true }),
            method: 'GET',
        })
            .then(interceptCookies)
            .then(r => r.json())
            .then(settings => {
            CSRF_TOKEN = settings.csrf_token;
            saveProfile(CSRF_TOKEN);
        });
    });
}
//# sourceMappingURL=auth.js.map