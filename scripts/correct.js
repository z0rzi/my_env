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
import fetch from 'node-fetch';
import clipboardy from 'clipboardy';
function reverso(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = {
            englishDialect: 'indifferent',
            autoReplace: false,
            getCorrectionDetails: true,
            interfaceLanguage: 'fr',
            locale: '',
            language: 'fra',
            text,
            originalText: '',
            spellingFeedbackOptions: {
                insertFeedback: true,
                userLoggedOn: true,
            },
            origin: 'interactive',
        };
        return fetch('https://orthographe.reverso.net/api/v1/Spelling/', {
            headers: {
                'content-type': 'application/*+json',
                accept: 'text/json',
                origin: 'https://www.reverso.net',
                referer: 'https://www.reverso.net/',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.167 Safari/537.36',
            },
            body: JSON.stringify(body),
            method: 'POST',
        })
            .then(res => {
            return res.json();
        })
            .then((res) => {
            const mistakes = res.corrections.map(corr => ({
                originalText: corr.mistakeText,
                from: corr.startIndex,
                to: corr.endIndex + 1,
                message: corr.longDescription,
                replacement: corr.suggestions[0].text,
            }));
            mistakes.push(...res.autoReplacements.map(repl => ({
                originalText: repl.mistakeText,
                from: repl.startIndex,
                to: repl.endIndex + 1,
                message: 'Remplacement Automatique',
                replacement: repl.replacementText,
            })));
            return mistakes;
        });
    });
}
function corrector_co(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = new URLSearchParams();
        body.append('language', 'fr');
        body.append('text', text);
        return fetch('https://api.languagetool.org/v2/check', {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body,
            method: 'POST',
        })
            .then(res => res.json())
            .then((res) => {
            return res.matches.map(match => ({
                originalText: text.slice(match.offset, match.offset + match.length),
                from: match.offset,
                to: match.offset + match.length,
                message: match.message,
                replacement: match.replacements[0].value,
            }));
        });
    });
}
export function findMistakes(sentence) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!sentence)
            return [];
        return reverso(sentence).catch(() => corrector_co(sentence));
    });
}
export function correctSentence(sentence) {
    return __awaiter(this, void 0, void 0, function* () {
        const mistakes = yield findMistakes(sentence);
        console.log(mistakes);
        for (const mistake of mistakes.reverse()) {
            const before = sentence.slice(0, mistake.from);
            const after = sentence.slice(mistake.to);
            sentence = before + mistake.replacement + after;
        }
        return sentence;
    });
}
if (/correct.js/.test(process.argv[1])) {
    let content = '';
    if (process.argv.length > 2)
        content = process.argv.slice(2).join(' ');
    else
        content = clipboardy.readSync();
    if (!content) {
        process.exit(1);
    }
    correctSentence(content).then(res => {
        console.log(res);
        clipboardy.writeSync(res);
        console.log('Corrected sentence in the clipboard!');
    });
}
