#!/bin/node

const HOME = process.env['HOME'];
const EMOJI_FILE_PATH = `${HOME}/.local/share/emojis2.json`;

import { writeSync } from 'clipboardy';

import fs from 'fs';
import fetch from 'node-fetch';
import { FuzzyFinder } from './fuzzyFinder.js';

type ApiEmoji = {
    Code: string;
    Name: string;
    score: number;
};

type Emoji = {
    icon: string;
    name: string;
    tags: string;
};

function codeToEmoji(code: string): string {
    if (!code) return '';
    code = code.trim();
    if (code.length === 4) return String.fromCharCode(parseInt(code, 16));
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
    } else if (num < 0x8) {
        myNum = 0x100 + num - 0x4;
    } else {
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

async function findEmojis(search: string): Promise<Emoji[]> {
    return fetch(
        'https://emojifinder.com/*/ajax.php?action=search&query=' +
            encodeURIComponent(search),
        { method: 'GET' }
    )
        .then(res => res.json())
        .then(res => res.results as ApiEmoji[])
        .then(res => {
            if (!res) return [];
            return res.map(apiEmo => ({
                icon: codeToEmoji(apiEmo.Code),
                name: apiEmo.Name,
                tags: apiEmo.Name,
            }));
        });
}

function loadPreviousEmos(): Emoji[] {
    const emos = JSON.parse(fs.readFileSync(EMOJI_FILE_PATH).toString());
    return emos;
}

root();
async function root() {
    let search = '';
    const prevEmojis = loadPreviousEmos();
    const emojiFinder = new FuzzyFinder(
        prevEmojis.map(e => ({
            label: e.icon,
            tags: e.name + ' ' + e.tags,
            payload: e,
        })),
        choice => {
            if (!choice) process.exit(1);
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
            fs.writeFileSync(
                EMOJI_FILE_PATH,
                JSON.stringify(prevEmojis, null, 2)
            );
            process.exit(0);
        }
    );
    let tid = null as NodeJS.Timeout;
    emojiFinder.onSearchChange = (text: string) => {
        search = text;
        if (tid) clearTimeout(tid);
        tid = setTimeout(() => {
            findEmojis(text).then(emojis => {
                const emojisChoices = emojis.map(e => ({
                    label: e.icon,
                    tags: text + ' ' + e.name + ' ' + e.tags,
                    payload: e,
                }));
                emojisChoices.push(
                    ...prevEmojis.map(e => ({
                        label: e.icon,
                        tags: ' ' + e.name + ' ' + e.tags,
                        payload: e,
                    }))
                );
                emojiFinder.choices = emojisChoices;
            });
        }, 500);
    };
}
