#!/bin/bun

import fs from 'fs';
import { sourceCmd } from './shell.js';

let buff = '';
process.stdin.on('data', d => (buff += d.toString()));

process.stdin.on('end', () => {
    if (process.stdout.isTTY) {
        fs.writeFileSync('/tmp/_.json', JSON.stringify(JSON.parse(buff), null, 2));

        const cmd =  `bat -pp --color=${process.stdout.isTTY?'always':'never'} /tmp/_.json`.split(/\s/g)
        sourceCmd(cmd.shift(), cmd);
    } else {
        console.log(JSON.stringify(JSON.parse(buff), null, 2));
    }
});
