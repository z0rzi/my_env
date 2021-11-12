#!/bin/node
import path from 'path';
import fs from 'fs';
import * as git from './git.js';
if (process.argv.length <= 2) {
    console.log("USAGE = 'cplight <from> <to>'");
    process.exit(1);
}
const fromPath = process.argv[2];
const toPath = process.argv[3];
if (fs.statSync(toPath).isFile())
    throw new Error(`'${toPath}' already exists...`);
const fromPrefix = path.dirname(fromPath);
git.searchFile(fromPath, /./, resPath => {
    const newPath = path.join(toPath, path.relative(fromPrefix, resPath));
    fs.mkdirSync(path.dirname(newPath), { recursive: true });
    fs.copyFileSync(resPath, newPath);
});
console.log(`copied '${fromPath}' to '${toPath}'`);
//# sourceMappingURL=cplight.js.map