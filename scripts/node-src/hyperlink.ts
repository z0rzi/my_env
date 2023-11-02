#!/bin/env node

import readline from 'readline';
import fs from 'fs';
import kl from 'kleur';
import child_process from 'child_process';

import * as kitty from './kitty.js';

const _colorModifierRx = '\\x1b\\[\\d+(?:;\\d+)*m';

const colorModifierRx = new RegExp(_colorModifierRx, 'gi');

const _fileRx = `\\/?(?:[a-zA-Z-_.]*/(?:${_colorModifierRx})?)+\\S*\\.[a-z]{2,4}\\b`;
const _lineNumsParenthesis = '\\(\\d+,\\d+\\)';
const _lineNumsColon = `(?:${_colorModifierRx})*:(?:${_colorModifierRx})*\\d+(?:${_colorModifierRx})*:(?:${_colorModifierRx})*\\d+`;

const hyperlinkRx = new RegExp(
    `(?:${_colorModifierRx})?${_fileRx}(?:${_colorModifierRx})?(?:${_lineNumsColon}|${_lineNumsParenthesis})?`,
    'gi'
);

let kittyTabId = '_unloaded_';
async function loadTabId() {
    const self = await kitty.getSelf();

    if (!self) return;

    kittyTabId = '';
    kittyTabId += self.instance.platform_window_id + '_';
    kittyTabId += self.tab.id;
}
async function logLink(link: string) {
    if (!fs.existsSync('/tmp/hyperlogs')) {
        fs.mkdirSync('/tmp/hyperlogs');
    }

    fs.appendFileSync('/tmp/hyperlogs/' + kittyTabId + '.log', link + '\n');
}

function removeColors(coloredString: string): string {
    return coloredString.replace(colorModifierRx, '');
}

/**
 * Encodes an hypertext link in a string
 *
 * @param rawLink The string representing the file name, sometimes the line and col numbers
 *
 * @returns The encoded hyperlink text if the file exists. Otherwise, the original text.
 */
export function encodeLink(rawLink: string): string {
    let link = removeColors(rawLink);

    let lineNum = 1;
    let colNum = 1;

    const filePath = link.replace(/[\d\W]+$/, numbers => {
        const matches = numbers.match(/\d+/g);
        if (matches?.[0]) {
            lineNum = +matches[0];
        }
        if (matches?.[1]) {
            colNum = +matches[1];
        }
        return '';
    });

    let realPath = '';
    try {
        realPath = fs.realpathSync(filePath);
    } catch (err) {
        // The path doesn't exist...
        return rawLink;
    }

    const hyperlink = `file://${realPath}?line=${lineNum}&col=${colNum}`;

    return `\x1b]8;;${hyperlink}\x1b\\${kl.italic(
        kl.blue(link)
    )}\x1b]8;;\x1b\\`;
}

export function addHyperlinksToText(text: string): string {
    let hyperlinkMatch: RegExpExecArray | null;

    let links = [] as { index: number; link: string }[];

    while ((hyperlinkMatch = hyperlinkRx.exec(text)) !== null) {
        links.push({
            index: hyperlinkMatch.index,
            link: hyperlinkMatch[0],
        });
    }

    // Starting with the end
    links = links.reverse();

    let formatedText = text;

    let lastColorModifier = '';

    for (const { index, link } of links) {
        const linkIdx = index;

        // To avoid messing up the colors, we look for the last color change in the output.
        // We display this color after the link.
        let idx = linkIdx;
        while (idx > 0) {
            const char = formatedText[idx];
            if (char === '\x1b') {
                // Change of colors... probably.
                lastColorModifier =
                    formatedText.slice(idx).match(colorModifierRx)?.[0] || '';
                break;
            }
            idx--;
        }

        logLink(link);

        formatedText =
            formatedText.slice(0, linkIdx) +
            encodeLink(link) +
            lastColorModifier +
            formatedText.slice(linkIdx + link.length);
    }

    // return formatedText;
    return formatedText;
}

async function getLinks() {
    if (!fs.existsSync('/tmp/hyperlogs/' + kittyTabId + '.log')) {
        console.log('No links found');
        process.exit(0);
    }
    const links = fs.readFileSync(
        '/tmp/hyperlogs/' + kittyTabId + '.log',
        'utf-8'
    );
    return links.split('\n').filter(Boolean);
}

async function main(args: string[], options: string[]) {
    await loadTabId();

    if (options.includes('-get-links')) {
        getLinks().then(links => {
            for (const link of links) {
                console.log(link);
            }
        });
    } else if (args.length) {
        const cmd = 'script --flush --quiet --return /dev/null --command'.split(
            /\s+/g
        );
        const proc = child_process.spawn(cmd.shift()!, [
            ...cmd,
            args.join(' ').replace(/\\/g, '\\\\'),
        ]);

        function indata(c: Buffer) {
            proc.stdin.write(c);
        }
        function outdata(c: Buffer) {
            process.stdout.write(addHyperlinksToText(c.toString()));
        }
        function errdata(c: Buffer) {
            process.stderr.write(addHyperlinksToText(c.toString()));
        }

        process.stdin.resume();
        process.stdin.on('data', indata);
        proc.stdout.on('data', outdata);
        proc.stderr.on('data', errdata);

        proc.on('exit', function (code) {
            process.stdin.pause();

            process.stdin.removeListener('data', indata);
            proc.stdout.removeListener('data', outdata);
            proc.stderr.removeListener('data', errdata);

            process.exit(code!);
        });
    } else {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });

        const logToCli = (message: string) => {
            process.stdout.write(message + '\r\n');
        };

        rl.on('line', line => {
            logToCli(addHyperlinksToText(line));
        });

        rl.once('close', () => {});
    }
}

const args = process.argv.slice(2);
const options = [] as string[];

while (args.length && args[0].startsWith('-')) {
    options.push(args.shift()!);
}

main(args, options);
