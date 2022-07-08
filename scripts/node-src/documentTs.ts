#!/bin/node

import fs from 'fs';

const args = process.argv.slice(2);

let linenum: number, filepath: string;

while (args.length) {
    const arg = args.pop();
    if (fs.existsSync(arg)) filepath = arg;
    if (!isNaN(Number(arg))) linenum = Number(arg);
}

if (!filepath || !linenum) {
    console.log('USAGE = "documentTs.js <filepath> <linenum>"');
    process.exit(1);
}

const fileContent = fs.readFileSync(filepath).toString().split('\n');

function line(linenr: number) {
    return fileContent[linenr - 1] || '';
}

while (linenum >= 0 && !/>\(|\w\(/.test(line(linenum))) linenum--;

let lineContent = line(linenum).replace(/^.*\(/, '');
let rawFuncArgs = '';

let braceStack = 0;
while (true) {
    if (lineContent == null) process.exit(1);
    for (const char of lineContent.split('')) {
        if (char === '(') braceStack++;
        if (char === ')') braceStack--;
    }
    rawFuncArgs += lineContent;
    if (braceStack <= 0 && /\)\s*=>|\)\s*|\)\s*:\{/.test(lineContent)) break;

    linenum++;
    lineContent = line(linenum);
}

rawFuncArgs = rawFuncArgs.replace(/\)[^)]*?$/, '').trim();

braceStack = 0;
let curvStack = 0;
let beakStack = 0;
let sharpStack = 0;
let qStack = false;
let dqStack = false;

const funcArgs = [] as String[];
let argName = '';
let inType = false;
for (const char of rawFuncArgs.split('')) {
    if (char === '{') curvStack++;
    if (char === '}') curvStack--;
    if (char === '<') beakStack++;
    if (char === '>') beakStack--;
    if (char === '[') sharpStack++;
    if (char === ']') sharpStack--;
    if (char === '(') braceStack++;
    if (char === ')') braceStack--;
    if (char === "'") qStack = !qStack;
    if (char === '"') dqStack = !dqStack;

    if (!curvStack && !beakStack && !sharpStack && !braceStack && !qStack && !dqStack) {
        if (char === ':') {
            funcArgs.push(argName)
            argName = '';
            inType = true;
        }

        if (inType) {
            if (char === ',') inType = false;
        } else {
            if (/\w/.test(char)) argName += char;
        }
    }
}

let out = '/**\n *\n *\n';

for (const argName of funcArgs) {
    out += ' * @params ' + argName + '\n'
}
out += ' */'

console.log(out);
