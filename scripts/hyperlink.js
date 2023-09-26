#!/bin/env node
import readline from 'readline';
import fs from 'fs';
import kl from 'kleur';
import child_process from 'child_process';
const _colorModifierRx = '\\x1b\\[\\d+m';
const colorModifierRx = new RegExp(_colorModifierRx, 'gi');
const _fileRx = '\\/?[a-zA-Z-_]*\\/\\S*\\.[tj]s\\b';
const _lineNumsParenthesis = '\\(\\d+,\\d+\\)';
const _lineNumsColon = ':\\d+:\\d+';
const hyperlinkRx = new RegExp(`(?:${_colorModifierRx})?${_fileRx}(?:(?:${_colorModifierRx})?(?:${_lineNumsColon}|${_lineNumsParenthesis}))?`, 'gi');
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
function encodeLink(rawLink) {
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
    return `\x1b]8;;${hyperlink}\x1b\\${kl.italic(kl.blue(rawLink))}\x1b]8;;\x1b\\`;
}
function addHyperlinksToText(text) {
    let hyperlinkMatch;
    let lastColorModifier = '';
    while ((hyperlinkMatch = hyperlinkRx.exec(text)) !== null) {
        const link = hyperlinkMatch[0];
        const linkIdx = hyperlinkMatch.index;
        // To avoid messing up the colors, we look for the last color change in the output.
        // We display this color after the link.
        let idx = linkIdx;
        while (idx > 0) {
            const char = text[idx];
            if (char === '\x1b') {
                // Change of colors... probably.
                lastColorModifier = text.slice(idx).match(colorModifierRx)[0];
                break;
            }
            idx--;
        }
        text =
            text.slice(0, linkIdx) +
                encodeLink(link) +
                lastColorModifier +
                text.slice(linkIdx + link.length);
    }
    return text;
}
const args = process.argv.slice(2);
if (args.length) {
    const cmd = 'script --flush --quiet --return --command'.split(/\s+/g);
    const proc = child_process.spawn(cmd.shift(), [...cmd, args.join(' ')]);
    function indata(c) {
        proc.stdin.write(c);
    }
    function outdata(c) {
        process.stdout.write(addHyperlinksToText(c.toString()));
    }
    process.stdin.resume();
    process.stdin.on('data', indata);
    proc.stdout.on('data', outdata);
    proc.on('exit', function (code) {
        process.stdin.pause();
        process.stdin.removeListener('data', indata);
        proc.stdout.removeListener('data', outdata);
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
