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
import fs from 'fs';
import path from 'path';
import { cmd } from './shell.js';
const args = process.argv.slice(2);
const gitCommits = [];
const files = [];
for (const arg of args) {
    if (/^[0-9a-f]+$/.test(arg)) {
        // It's a git commit
        gitCommits.push(arg);
    }
    else if (fs.existsSync(arg)) {
        files.push(arg);
    }
}
function err() {
    console.log('USAGE = diff.js <file1> <file2>');
    console.log('        OR');
    console.log('        diff.js <#commit> <file1> <file2>');
    console.log('        OR');
    console.log('        diff.js <#commit1> <#commit2> <file>');
    process.exit(1);
}
if (gitCommits.length > 2 ||
    files.length > 2 ||
    files.length === 0 ||
    (gitCommits.length > 1 && files.length > 1)) {
    err();
}
const ext = path.extname(files[0]);
const blank = new Set([' ', '\t', '\r', '\n']);
function isBlank(char) {
    return blank.has(char);
}
function isSameCode(left, right) {
    let rightIdx = 0;
    let leftIdx = 0;
    while (isBlank(left[leftIdx]))
        leftIdx++;
    while (isBlank(right[rightIdx]))
        rightIdx++;
    while (rightIdx < right.length || leftIdx < left.length) {
        const leftChar = left[leftIdx];
        const rightChar = right[rightIdx];
        if (leftChar !== rightChar) {
            return false;
        }
        leftIdx++;
        rightIdx++;
        while (isBlank(left[leftIdx]))
            leftIdx++;
        while (isBlank(right[rightIdx]))
            rightIdx++;
    }
    return true;
}
function compareFiles(leftFile, rightFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield cmd(`diff -E -Z -b -w ${leftFile} ${rightFile}`);
        const lines = res.split(/\n/g);
        const leftContent = fs.readFileSync(leftFile, 'utf8').split(/\n/g);
        const rightContent = fs.readFileSync(rightFile, 'utf8').split(/\n/g);
        for (const line of lines) {
            if (/^\d/.test(line)) {
                // new difference!
                const matches = line.match(/^(\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)$/);
                const linesFrom = matches[1].split(',').map(Number);
                const mode = matches[2];
                const linesTo = matches[3].split(',').map(Number);
                if (linesFrom.length === 1)
                    linesFrom.push(linesFrom[0]);
                if (linesTo.length === 1)
                    linesTo.push(linesTo[0]);
                if (mode === 'c') {
                    const leftCode = leftContent
                        .slice(linesFrom[0] - 1, linesFrom[1])
                        .join('\n');
                    const rightCode = rightContent
                        .slice(linesTo[0] - 1, linesTo[1])
                        .join('\n');
                    if (!isSameCode(leftCode, rightCode)) {
                        const left = yield cmd(`bat --color=always -pp ${leftFile} -r ${linesFrom[0]}:${linesFrom[1] + 1}`);
                        console.log(`Line ${linesFrom[0]}`);
                        console.log(left);
                        const right = yield cmd(`bat --color=always -pp ${rightFile} -r ${linesTo[0]}:${linesTo[1] + 1}`);
                        console.log(`Line ${linesTo[0]}`);
                        console.log(right);
                        console.log('―――――――――――――――――――――――――――――――――――――――――――――――――――');
                    }
                }
            }
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    if (gitCommits.length === 2) {
        // Comparing the same file on 2 commmits
        yield cmd(`git show ${gitCommits[0]}:${files[0]} > /tmp/left${ext}`);
        yield cmd(`git show ${gitCommits[1]}:${files[0]} > /tmp/right${ext}`);
    }
    else if (files.length === 2) {
        if (gitCommits.length) {
            yield cmd(`git show ${gitCommits[0]}:${files[0]} > /tmp/left${ext}`);
            yield cmd(`git show ${gitCommits[0]}:${files[1]} > /tmp/right${ext}`);
        }
        else {
            yield cmd(`cat ${files[0]} > /tmp/left${ext}`);
            yield cmd(`cat ${files[1]} > /tmp/right${ext}`);
        }
    }
    else {
        err();
    }
}))()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield compareFiles('/tmp/left' + ext, '/tmp/right' + ext);
}))
    .catch(err => {
    throw err;
});
