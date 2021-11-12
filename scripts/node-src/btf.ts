#!/bin/node

let buff = '';
process.stdin.on('data', d => (buff += d.toString()));

process.stdin.on('end', () => {
    console.log(JSON.parse(buff));
});
