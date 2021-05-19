#!/bin/node
const MODIFIDERS = [
    {
        rx: /^(27-91-)(?:49-)?(\d+-)?59-5[0-6]-(\d+)$/,
        replacement: '$1$2$3',
        mod: keyCode => {
            const mods = {
                ctrl: false,
                shift: false,
                alt: false,
            };
            const match = keyCode.match(/^(?:\d+-){4}5(?<k>[0-6])-\d+$/);
            if (!match || !('groups' in match))
                mods;
            const k = Number(match.groups.k) + 1;
            return {
                shift: !!((k >> 0) % 2),
                alt: !!((k >> 1) % 2),
                ctrl: !!((k >> 2) % 2),
            };
        },
    },
    {
        rx: /^27-(\d+)$/,
        replacement: '$1',
        mod: () => ({ ctrl: false, shift: false, alt: true }),
    },
];
const KEYCODES = {
    '9': 'tab',
    '13': 'return',
    '127': 'backspace',
    '27': 'escape',
    '27-91-90': { shift: true, key: 'tab' },
    '6-32-13': { ctrl: true, key: 'return' },
    '27-91-65': 'up',
    '27-91-66': 'down',
    '27-91-67': 'right',
    '27-91-68': 'left',
    '27-91-51-126': 'delete',
    '27-91-70': 'end',
    '27-91-72': 'home',
    '27-91-54-126': 'pgdown',
    '27-91-53-126': 'pgup',
};
function buffToCode(buff) {
    const res = [];
    let num = 0;
    while (true) {
        try {
            res.push(String(buff.readIntBE(num, 1)));
        }
        catch (err) {
            return res.join('-');
        }
        num++;
    }
}
export class Keyboard {
    constructor() {
        this.active = false;
    }
    static getInstance() {
        if (!this._instance)
            this._instance = new Keyboard();
        return this._instance;
    }
    async getOneKey() {
        process.stdin.setRawMode(true);
        return new Promise((resolve, reject) => {
            process.stdin.once('data', data => {
                if (!this.active) {
                    return reject();
                }
                const byteArray = [...data];
                if (byteArray.length > 0 && byteArray[0] === 3) {
                    console.log('^C');
                    process.exit(1);
                }
                // process.stdin.setRawMode(false);
                return resolve(buffToCode(data));
            });
        }).then(keyCode => {
            let mods = {
                shift: false,
                ctrl: false,
                alt: false,
            };
            // Looking for modifiers
            for (const modifier of MODIFIDERS) {
                if (modifier.rx.test(keyCode)) {
                    mods = modifier.mod(keyCode);
                    keyCode = keyCode.replace(modifier.rx, modifier.replacement);
                }
            }
            // Exact matches with keymaps
            if (String(keyCode) in KEYCODES) {
                let out = { key: '' };
                if (typeof KEYCODES[String(keyCode)] === 'string') {
                    out = { key: KEYCODES[String(keyCode)] };
                }
                else {
                    out = KEYCODES[String(keyCode)];
                }
                return Object.assign(mods, out);
            }
            // Normal printable characters ([a-z0-9])
            let cara = String.fromCharCode(Number(keyCode));
            if (/\w/.test(cara)) {
                if (/[A-Z]/.test(cara)) {
                    mods.shift = true;
                    cara = cara.toLowerCase();
                }
                return Object.assign({ key: cara }, mods);
            }
            if (Number(keyCode)) {
                cara = String.fromCharCode(Number(keyCode) + 96);
                if (/[a-z]/.test(cara)) {
                    mods.ctrl = true;
                    return Object.assign({ key: cara }, mods);
                }
            }
            return Object.assign({
                key: keyCode,
            }, mods);
        });
    }
    async onKeyPress(cb) {
        this.active = true;
        process.stdin.resume();
        while (true) {
            if (!this.active)
                return;
            try {
                const key = await this.getOneKey();
                cb(key);
            }
            catch (err) {
                return;
            }
        }
    }
    offKeyPress() {
        process.stdin.pause();
        this.active = false;
    }
}
Keyboard._instance = null;
//# sourceMappingURL=keyboard.js.map