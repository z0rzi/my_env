#!/bin/node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const HOME = process.env['HOME'];
const EMOJI_FILE_PATH = `${HOME}/.local/share/emojis2.json`;
import { writeSync } from 'clipboardy';
import fs from 'fs';
import fetch from 'node-fetch';
import { FuzzyFinder } from './fuzzyFinder.js';
function codeToEmoji(code) {
    if (!code)
        return '';
    code = code.trim();
    if (code.length === 4)
        return String.fromCharCode(parseInt(code, 16));
    if (/\s/.test(code)) {
        return code
            .trim()
            .split(/\s+/g)
            .map(subCode => codeToEmoji(subCode))
            .join('');
    }
    let myCode = 'D83';
    const ending = code.slice(3);
    const num = parseInt(code[2], 16);
    let myNum = 0;
    if (num < 0x4) {
        myNum = num;
    }
    else if (num < 0x8) {
        myNum = 0x100 + num - 0x4;
    }
    else {
        myNum = 0x200 + num - 0x8;
    }
    let emoji = '';
    myCode += (myNum + 0xcdc).toString(16);
    myCode += ending;
    myCode = `${myCode.slice(0, 4)} ${myCode.slice(4)}`;
    for (const part of myCode.split(/\s+/))
        emoji += String.fromCharCode(parseInt(part, 16));
    return emoji;
}
function findEmojis(search) {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://emojifinder.com/*/ajax.php?action=search&query=' +
            encodeURIComponent(search), { method: 'GET' })
            .then(res => res.json())
            .then(res => res.results)
            .then(res => {
            if (!res)
                return [];
            return res.map(apiEmo => ({
                icon: codeToEmoji(apiEmo.Code),
                name: apiEmo.Name,
                tags: apiEmo.Name,
            }));
        });
    });
}
function loadPreviousEmos() {
    const emos = JSON.parse(fs.readFileSync(EMOJI_FILE_PATH).toString());
    return emos;
}
root();
function root() {
    return __awaiter(this, void 0, void 0, function* () {
        let search = '';
        const prevEmojis = loadPreviousEmos();
        const emojiFinder = new FuzzyFinder(prevEmojis.map(e => ({
            label: e.icon,
            tags: e.name + ' ' + e.tags,
            payload: e,
        })), choice => {
            if (!choice)
                process.exit(1);
            writeSync(choice.payload.icon);
            let emojiAlreadyThere = false;
            for (let i = 0; i < prevEmojis.length; i++) {
                if (prevEmojis[i].icon === choice.label) {
                    prevEmojis[i].tags += ' ' + search;
                    if (!prevEmojis[i].tags.includes(search))
                        prevEmojis[i].tags += ' ' + search;
                    const emoji = prevEmojis.splice(i, 1)[0];
                    prevEmojis.unshift(emoji);
                    emojiAlreadyThere = true;
                }
            }
            if (!emojiAlreadyThere) {
                if (!choice.payload.tags.includes(search))
                    choice.payload.tags += ' ' + search;
                prevEmojis.unshift(choice.payload);
            }
            fs.writeFileSync(EMOJI_FILE_PATH, JSON.stringify(prevEmojis, null, 2));
            process.exit(0);
        });
        let tid = null;
        let text = '';
        const fetchResults = () => {
            if (tid)
                clearTimeout(tid);
            tid = setTimeout(() => {
                findEmojis(text).then(emojis => {
                    const emojisChoices = emojis.map(e => ({
                        label: e.icon,
                        tags: text + ' ' + e.name + ' ' + e.tags,
                        payload: e,
                    }));
                    emojisChoices.push(...prevEmojis.map(e => ({
                        label: e.icon,
                        tags: ' ' + e.name + ' ' + e.tags,
                        payload: e,
                    })));
                    emojiFinder.choices = emojisChoices;
                });
            }, 500);
        };
        emojiFinder.onSearchChange = (search) => {
            text = search;
            fetchResults();
        };
        emojiFinder.onCursorMove = () => {
            fetchResults();
        };
    });
}
