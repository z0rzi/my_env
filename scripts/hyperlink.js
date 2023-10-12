#!/bin/env node
import readline from 'readline';
import fs from 'fs';
import kl from 'kleur';
import child_process from 'child_process';
const _colorModifierRx = '\\x1b\\[\\d+(?:;\\d+)*m';
const colorModifierRx = new RegExp(_colorModifierRx, 'gi');
const _fileRx = `\\/?(?:[a-zA-Z-_.]*/(?:${_colorModifierRx})?)+\\S*\\.[a-z]{2,4}\\b`;
const _lineNumsParenthesis = '\\(\\d+,\\d+\\)';
const _lineNumsColon = `(?:${_colorModifierRx})*:(?:${_colorModifierRx})*\\d+(?:${_colorModifierRx})*:(?:${_colorModifierRx})*\\d+`;
const hyperlinkRx = new RegExp(`(?:${_colorModifierRx})?${_fileRx}(?:${_colorModifierRx})?(?:${_lineNumsColon}|${_lineNumsParenthesis})?`, 'gi');
function removeColors(coloredString) {
    return coloredString.replace(colorModifierRx, '');
}
/**
 * Encodes an hypertext link in a string
 *
 * @param rawLink The string representing the file name, sometimes the line and col numbers
 *
 * @returns The encoded hyperlink text if the file exists. Otherwise, the original text.
 */
export function encodeLink(rawLink) {
    let link = removeColors(rawLink);
    let lineNum = 1;
    let colNum = 1;
    const filePath = link.replace(/[\d\W]+$/, numbers => {
        const matches = numbers.match(/\d+/g);
        if (matches === null || matches === void 0 ? void 0 : matches[0]) {
            lineNum = +matches[0];
        }
        if (matches === null || matches === void 0 ? void 0 : matches[1]) {
            colNum = +matches[1];
        }
        return '';
    });
    let realPath = '';
    try {
        realPath = fs.realpathSync(filePath);
    }
    catch (err) {
        // The path doesn't exist...
        return rawLink;
    }
    const hyperlink = `file://${realPath}?line=${lineNum}&col=${colNum}`;
    return `\x1b]8;;${hyperlink}\x1b\\${kl.italic(kl.blue(link))}\x1b]8;;\x1b\\`;
}
export function addHyperlinksToText(text) {
    var _a;
    let hyperlinkMatch;
    let links = [];
    while ((hyperlinkMatch = hyperlinkRx.exec(text)) !== null) {
        links.push({
            index: hyperlinkMatch.index,
            link: hyperlinkMatch[0]
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
                lastColorModifier = ((_a = formatedText.slice(idx).match(colorModifierRx)) === null || _a === void 0 ? void 0 : _a[0]) || '';
                break;
            }
            idx--;
        }
        formatedText =
            formatedText.slice(0, linkIdx) +
                encodeLink(link) +
                lastColorModifier +
                formatedText.slice(linkIdx + link.length);
    }
    // return formatedText;
    return formatedText;
}
const args = process.argv.slice(2);
if (args.length) {
    const cmd = 'script --flush --quiet --return /dev/null --command'.split(/\s+/g);
    const proc = child_process.spawn(cmd.shift(), [...cmd, args.join(' ').replace(/\\/g, '\\\\')]);
    function indata(c) {
        proc.stdin.write(c);
    }
    function outdata(c) {
        process.stdout.write(addHyperlinksToText(c.toString()));
    }
    function errdata(c) {
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
        process.exit(code);
    });
}
else {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    const logToCli = (message) => {
        process.stdout.write(message + '\r\n');
    };
    rl.on('line', line => {
        logToCli(addHyperlinksToText(line));
    });
    rl.once('close', () => { });
}
