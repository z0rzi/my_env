#!/bin/node
import fs from 'fs';
import { cmd } from './shell.js';
let buff = '';
process.stdin.on('data', d => (buff += d.toString()));
process.stdin.on('end', () => {
    fs.writeFileSync('/tmp/_.json', JSON.stringify(JSON.parse(buff), null, 2));
    cmd(`bat -pp --color=always /tmp/_.json`).then(res => {
        console.log(res);
    });
});
