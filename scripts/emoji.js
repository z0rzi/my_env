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
const EMOJI_FILE_PATH = `${HOME}/.local/share/emojis.json`;
import { writeSync } from 'clipboardy';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { get } from 'https';
import { FuzzyFinder } from './fuzzyFinder.js';
function setupFile() {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function loadEmojis() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!existsSync(EMOJI_FILE_PATH))
            yield setupFile();
        const raw = readFileSync(EMOJI_FILE_PATH);
        return JSON.parse(raw);
    });
}
root();
function root() {
    return __awaiter(this, void 0, void 0, function* () {
        let emojis = yield loadEmojis();
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
    });
}
