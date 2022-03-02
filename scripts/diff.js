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
import { cmd, mapArgs } from './shell.js';
let options = [];
let files = [];
mapArgs({
    '^-.*': (arg) => { options.push(arg); },
    '': (arg => files.push(arg))
}, { multiMatch: false });
if (files.length < 2) {
    console.log('Could not find 2 files among the provided arguments...');
    process.exit(1);
}
function parseLines(rawLines) {
    let lines = rawLines.split(/,/g).map(Number);
    return lines.slice(0, 2);
}
class Diff {
    constructor(raw) {
        this.mode = '';
        this.linesIn = [];
        this.linesOut = [];
        this.before = '';
        this.after = '';
        const matches = raw.match(/^(?<linesIn>[0-9,]+)(?<mode>[acd])(?<linesOut>[0-9,]+)\n(?<content>(?:\s|\S)*)$/);
        if (!matches || !matches.groups)
            throw new Error('diff unrecognized: \n' + raw);
        const { linesIn, mode, linesOut, content } = matches.groups;
        this.mode = mode;
        this.linesIn = parseLines(linesIn);
        this.linesOut = parseLines(linesOut);
        const _content = content.replace(/(?<=^|\n)[><] /g, '');
        if (this.mode === 'a')
            this.after = _content;
        if (this.mode === 'd')
            this.before = _content;
        if (this.mode === 'c') {
            const split = _content.split(/\n---\n/);
            this.before = split[0];
            this.after = split[1];
        }
    }
    toString() {
        let out = this.linesIn.join(',') + this.mode + this.linesOut.join(',') + '\n';
        if (this.mode === 'c' || this.mode === 'd') {
            out += this.before
                .replace(/^/g, '< ')
                .replace(/\n/g, '\n< ');
        }
        if (this.mode === 'c') {
            out += '\n---\n';
        }
        if (this.mode === 'a' || this.mode === 'c') {
            out += this.after
                .replace(/^/g, '> ')
                .replace(/\n/g, '\n> ');
        }
        return out;
    }
}
main()
    .catch(e => {
    console.log('e', e);
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield cmd(`diff ${options.join(' ')} ${files.join(' ')}`);
        const diffs = res.split(/\n(?=[0-9,]+[acd][0-9,]+\n)/g);
        diffs.forEach(elem => {
            const d = new Diff(elem);
            console.log(d.toString());
        });
    });
}
