#!/bin/bun

import fs from 'fs';

const MODIFIDERS: {
  rx: RegExp;
  replacement: string;
  mod: (keyCode: string) => Modifiers;
}[] = [
  {
    rx: /^(27-91-)(?:49-)?(\d+-)?59-5[0-6]-(\d+)$/,
    replacement: "$1$2$3",
    mod: (keyCode) => {
      const mods = {
        ctrl: false,
        shift: false,
        alt: false,
      };
      const match = keyCode.match(/^(?:\d+-){4}5(?<k>[0-6])-\d+$/);
      if (!match || !("groups" in match)) mods;
      const k = Number(match!.groups!.k) + 1;
      return {
        shift: !!((k >> 0) % 2),
        alt: !!((k >> 1) % 2),
        ctrl: !!((k >> 2) % 2),
      };
    },
  },
  {
    rx: /^27-(\d+)$/,
    replacement: "$1",
    mod: () => ({ ctrl: false, shift: false, alt: true }),
  },
];

const KEYCODES: Record<
  string,
  string | { ctrl?: boolean; shift?: boolean; key: string }
> = {
  "9": "tab",
  "13": "return",
  "127": "backspace",
  "27": "escape",

  "27-91-90": { shift: true, key: "tab" },
  "6-32-13": { ctrl: true, key: "return" },

  "27-91-65": "up",
  "27-91-66": "down",
  "27-91-67": "right",
  "27-91-68": "left",

  "27-91-51-126": "delete",
  "27-91-70": "end",
  "27-91-72": "home",
  "27-91-54-126": "pgdown",
  "27-91-53-126": "pgup",

  "27-79-80": "f1",
  "27-79-81": "f2",
  "27-79-82": "f3",
  "27-79-83": "f4",

  // With modifiers
  "27-91-80": "f1",
  "27-91-81": "f2",
  "27-91-82": "f3",
  "27-91-83": "f4",

  "27-91-49-53-126": "f5",
  "27-91-49-55-126": "f6",
  "27-91-49-56-126": "f7",
  "27-91-49-57-126": "f8",
  "27-91-50-48-126": "f9",
  "27-91-50-49-126": "f10",
  "27-91-50-51-126": "f11",
  "27-91-50-52-126": "f12",
};

export type Modifiers = {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
};

export type Key = Modifiers & {
  key: string;
};

function buffToCode(buff: Buffer): string {
  const res = [] as string[];
  let num = 0;
  while (true) {
    try {
      res.push(String(buff.readIntBE(num, 1)));
    } catch (err) {
      return res.join("-");
    }
    num++;
  }
}

function log(message: string): void {
  fs.appendFileSync("/tmp/keyboard.log", message + "\n");
}

export class Keyboard {
  static _instance: null | Keyboard = null;
  rolling = false;
  callback: null | ((k: Key) => unknown) = null;

  static getInstance(): Keyboard {
    if (!this._instance) this._instance = new Keyboard();
    return this._instance;
  }

  async getOneKey(): Promise<Key | null> {
    if (!this.rolling) return Promise.resolve(null);
    process.stdin.setRawMode(true);
    return new Promise<string>((resolve, reject) => {
      process.stdin.once("data", (data) => {
        log('Get data')
        if (!this.callback) {
          return reject();
        }
        const byteArray = [...data];
        if (byteArray.length > 0 && byteArray[0] === 3) {
          console.log("^C");
          process.exit(1);
        }
        return resolve(buffToCode(data));
      });
    }).then((keyCode) => {
      let mods: Modifiers = {
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
        let out = { key: "" } as { key: string } & Partial<Modifiers>;
        const key = KEYCODES[String(keyCode)] as
          | string
          | { ctrl?: boolean; shift?: boolean; key: string };
        if (typeof key === "string") {
          out = { key };
        } else {
          out = key;
        }

        return Object.assign(mods, out);
      }

      // Normal printable characters ([a-z0-9])
      let cara = String.fromCharCode(Number(keyCode));
      if (/^[^\x00-\x1F\x80-\x9F]+$/.test(cara)) {
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

      return Object.assign({ key: keyCode }, mods);
    });
  }

  async onKeyPress(cb: (k: Key) => unknown): Promise<void> {
    log('onKeyPress')
    this.callback = cb;

    if (this.rolling) return;

    this.rolling = true;
    log('rolling true')
    process.stdin.resume();
    while (true) {
      if (!this.callback) break;

      try {
        const key = await this.getOneKey();
        if (!key) break;
        if (!this.rolling) {
          // Re-sending the intercepted key
          process.stdin.emit('data', Buffer.from(key.key));
          break;
        }

        this.callback(key);
      } catch (err) {
        break;
      }
    }
    log('rolling false 1')
    this.rolling = false;
  }

  offKeyPress(): void {
    log('offKeyPress')
    this.rolling = false;
    log('rolling false 2')

    // Immediately remove the data listener.
    process.stdin.removeAllListeners("data");
    process.stdin.setRawMode(false);
    process.stdin.pause();

    // Optionally, pause and resume stdin as an attempt to flush the buffer.
    process.stdin.resume();
    process.stdin.pause();
  }

  offKeyPress_old(): void {
    this.callback = null;
    const iid = setInterval(() => {
      if (!this.rolling) {
        clearInterval(iid);
        process.stdin.pause();
        process.stdin.removeAllListeners("data");
      }
    }, 100);
  }
}

if (/keyboard.ts/.test(process.argv[1])) {
  Keyboard.getInstance().onKeyPress((key) => {
    console.log(key);
  });
}
