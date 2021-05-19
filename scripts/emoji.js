#!/bin/node
const HOME = process.env['HOME'];
const EMOJI_FILE_PATH = `${HOME}/.local/share/emojis.json`;
import { writeSync } from 'clipboardy';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { get } from 'https';
import { FuzzyFinder } from './fuzzyFinder.js';
async function setupFile() {
    return new Promise((resolve, reject) => {
        get('https://raw.githubusercontent.com/amio/emoji.json/master/emoji.json', res => {
            let rawData = '';
            res.on('data', chunk => {
                rawData += chunk;
            });
            res.on('end', () => {
                const emojis = JSON.parse(rawData);
                const newEmojis = emojis.map(emo => ({
                    icon: emo.char,
                    name: emo.name,
                    tags: emo.subgroup.replace(/[^a-zA-Z]/g, ' '),
                }));
                writeFileSync(EMOJI_FILE_PATH, JSON.stringify(newEmojis));
                resolve();
            });
        });
    });
}
async function loadEmojis() {
    if (!existsSync(EMOJI_FILE_PATH))
        await setupFile();
    const raw = readFileSync(EMOJI_FILE_PATH);
    return JSON.parse(raw);
}
root();
async function root() {
    let emojis = await loadEmojis();
    new FuzzyFinder(emojis.map(e => ({
        label: e.icon,
        tags: e.name + ' ' + e.tags,
        payload: e,
    })), choice => {
        if (!choice)
            process.exit(1);
        writeSync(choice.payload.icon);
        const pos = emojis.indexOf(choice.payload);
        const e = emojis.splice(pos, 1);
        emojis = [...e, ...emojis];
        writeFileSync(EMOJI_FILE_PATH, JSON.stringify(emojis, null, 4));
        process.exit(0);
    });
}
//# sourceMappingURL=emoji.js.map