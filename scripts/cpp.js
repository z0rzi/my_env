#!/bin/node
import path from 'path';
import fs from 'fs';
import * as git from './git.js';
if (process.argv.length <= 2) {
    console.log('\nCopy files, ignoring the `.gitignore` files');
    console.log("\n\tUSAGE = 'cpp.js <from> <to>'\n");
    process.exit(1);
}
const fromPaths = process.argv.slice(2, process.argv.length - 2);
const toPath = process.argv[process.argv.length - 1];
for (const fromPath of fromPaths) {
    if (fs.statSync(toPath).isFile())
        throw new Error(`'${toPath}' already exists...`);
    const fromPrefix = path.dirname(fromPath);
    git.searchFile(fromPath, /./, resPath => {
        const newPath = path.join(toPath, path.relative(fromPrefix, resPath));
        fs.mkdirSync(path.dirname(newPath), { recursive: true });
        fs.copyFileSync(resPath, newPath);
    });
    console.log(`Copied '${fromPath}' to '${toPath}'`);
}
