#!/bin/node

const HOME = process.env['HOME'];
const EMOJI_FILE_PATH = `${HOME}/.local/share/emojis.json`;

const clipboardy = require('clipboardy');

const fs = require('fs');
const https = require('https');
const { FuzzyFinder } = require('./cli');

// Emoji received from the gh file:
// {
//     codes: '1F600',
//     char: '😀',
//     name: 'grinning face',
//     category: 'Smileys & Emotion (face-smiling)',
//     group: 'Smileys & Emotion',
//     subgroup: 'face-smiling',
// };

// Our emoji:
// {
//     icon: '😀',
//     name: 'grinning face',
//     tags: 'face grinning :)',
// };

async function setupFile() {
    return new Promise((resolve, reject) => {
        https.get(
            'https://raw.githubusercontent.com/amio/emoji.json/master/emoji.json',
            res => {
                let rawData = '';
                res.on('data', chunk => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    let emojis = JSON.parse(rawData);
                    emojis = emojis.map(emo => ({
                        icon: emo.char,
                        name: emo.name,
                        tags: emo.subgroup.replace(/[^a-zA-Z]/g, ' '),
                    }));
                    fs.writeFileSync(EMOJI_FILE_PATH, JSON.stringify(emojis));
                    resolve();
                });
            }
        );
    });
}

/**
 * loadEmojis.
 *
 * @return {Promise<{icon: string, name: string, tags: string}[]>} The emojis
 */
async function loadEmojis() {
    if (!fs.existsSync(EMOJI_FILE_PATH)) await setupFile();
    const raw = fs.readFileSync(EMOJI_FILE_PATH);
    return JSON.parse(raw);
}

root();
async function root() {
    let emojis = await loadEmojis();
    new FuzzyFinder(
        emojis.map(e => ({
            label: e.icon,
            tags: e.name + ' ' + e.tags,
            payload: e,
        })),
        choice => {
            if (!choice) process.exit(1);
            clipboardy.writeSync(choice.payload.icon);
            const pos = emojis.indexOf(choice.payload);
            const e = emojis.splice(pos, 1);
            emojis = [...e, ...emojis];
            fs.writeFileSync(EMOJI_FILE_PATH, JSON.stringify(emojis, null, 4));
            process.exit(0);
        }
    );
}
