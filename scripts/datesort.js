#!/bin/env node
import fs from 'fs';
import kleur from 'kleur';
const reverse = process.argv.includes('-r');
let buff = '';
process.stdin.on('data', d => (buff += d.toString()));
process.stdin.on('end', () => {
    const filePaths = buff.split(/\n/g);
    const fileMetas = filePaths.map(filePath => {
        try {
            const stats = fs.statSync(filePath);
            return [filePath, stats.mtime];
        }
        catch (err) {
            return null;
        }
    }).filter(metas => !!metas)
        .sort((metasA, metasB) => reverse ? +metasA[1] - +metasB[1] : +metasB[1] - +metasA[1]);
    if (process.stdout.isTTY) {
        console.log(fileMetas.map(([filePath]) => {
            filePath = filePath.replace(/^.*\//, (match) => {
                return kleur.gray(match);
            }).replace(/\/[^/]*\.[a-zA-Z]*$/, (match) => {
                let ext = '';
                match = match.replace(/\.[a-zA-Z]*$/, (e) => {
                    ext = e;
                    return '';
                });
                return kleur.dim().bold(match) + kleur.red(ext);
            });
            return filePath;
        }).join('\n'));
    }
    else {
        console.log(fileMetas.map(([filePath]) => filePath).join('\n'));
    }
});
