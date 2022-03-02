#!/bin/node
import path from 'path';
import * as git from './git.js';
if (process.argv.length <= 3) {
    console.log('\nSearch files, ignoring the `.gitignore` files');
    console.log("\n\tUSAGE = 'findd.js <path> <regex>'\n");
    process.exit(1);
}
const fromPath = process.argv[2];
const rx = process.argv[3] || '.';
const currentPath = path.resolve('./');
const relative = !path.isAbsolute(fromPath);
git.searchFile(fromPath, new RegExp(rx), resPath => {
    if (relative)
        resPath = path.relative(currentPath, resPath);
    if (!resPath.startsWith('.') && !resPath.startsWith('/'))
        resPath = './' + resPath;
    console.log(resPath);
});
