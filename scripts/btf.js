#!/bin/node
"use strict";
let buff = '';
process.stdin.on('data', d => (buff += d.toString()));
process.stdin.on('end', () => {
    console.log(JSON.parse(buff));
});
//# sourceMappingURL=btf.js.map