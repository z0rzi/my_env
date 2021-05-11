#!/bin/node

const HOME = process.env['HOME'];
const EMOJI_FILE_PATH = `${HOME}/.local/share/emojis.json`;

import { writeSync } from 'clipboardy';

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { get } from 'https';
import { FuzzyFinder } from './cli.js';


type ApiEmoji = {
    codes: number,
    char: string,
    name: string,
    category: string,
    group: string,
    subgroup: string
}

type Emoji = {
    icon: string,
    name: string,
    tags: string
}

async function setupFile() {
    return new Promise<void>((resolve, reject) => {
        get(
            'https://raw.githubusercontent.com/amio/emoji.json/master/emoji.json',
            res => {
                let rawData = '';
                res.on('data', chunk => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    const emojis = JSON.parse(rawData) as ApiEmoji[];
                    const newEmojis = emojis.map(emo => ({
                        icon: emo.char,
                        name: emo.name,
                        tags: emo.subgroup.replace(/[^a-zA-Z]/g, ' '),
                    })) as Emoji[];
                    writeFileSync(EMOJI_FILE_PATH, JSON.stringify(newEmojis));
                    resolve();
                });
            }
        );
    });
}

async function loadEmojis(): Promise<{icon: string, name: string, tags: string}[]> {
    if (!existsSync(EMOJI_FILE_PATH)) await setupFile();
    const raw = readFileSync(EMOJI_FILE_PATH) as unknown as string;
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
            writeSync(choice.payload.icon);
            const pos = emojis.indexOf(choice.payload);
            const e = emojis.splice(pos, 1);
            emojis = [...e, ...emojis];
            writeFileSync(EMOJI_FILE_PATH, JSON.stringify(emojis, null, 4));
            process.exit(0);
        }
    );
}
