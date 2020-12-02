#!/bin/node

const fs = require('fs');

process.argv.shift();
process.argv.shift();

if (!process.argv.length) {
    console.error('No file provided!');
    process.exit(1);
}

const beautify = process.argv.indexOf('--beautify') >= 0;


function getType(obj) {
    if (obj instanceof Date)
        return 'Date';
    if (Array.isArray(obj))
        return 'Array';
    if (typeof obj === 'string')
        if (!isNaN(new Date(obj).getTime()))
            return 'Date'

    return typeof obj;
}

function newline(lvl) {
    if (beautify)
        return '\n'+'  '.repeat(lvl);
    else
        return '';
}

function toTypescript(obj, idt = 0) {
    if (getType(obj) === 'Array') {
        const t = getType(obj[0]);
        const childs = [];
        if (obj.every(elem => getType(elem) === t)) {
            if (t !== 'object')
                return `${ toTypescript(obj[0]) }[] /* x${ obj.length } */`

            // it's an object
            const keys = Object.keys(obj[0]).map(key => ({ key, sure: true, type: toTypescript(obj[0][key], idt + 1) }));
            obj.forEach(child => {
                keys.filter(k => k.sure).forEach(k => {
                    if (!(k.key in child))
                        k.sure = false;
                });

                Object.keys(child).forEach(childKey => {
                    if (keys.findIndex(k => k.key === childKey) < 0) {
                        keys.push({ key: childKey, sure: false, type: toTypescript(child[childKey], idt + 1) });
                    }
                })
            })

            const str = keys.map(({ key, sure, type }) => (
                key + (sure ? ': ' : '?: ') + type
            )).join(',' + newline(idt+1))

            return `{${ newline(idt+1) + str + newline(idt) }}[] /* x${obj.length} */`;
        } else {
            obj.forEach(elem => {
                const str = toTypescript(elem, idt + 1);
                if (!childs.includes(str))
                    childs.push(str);
            })
            return `[(${ newline(idt+1) + childs.join(' | ') + newline(idt) })]`;
        }
    }
    if (getType(obj) === 'object') {
        const out = []
        for (const [key, val] of Object.entries(obj))
            out.push(`${ key }: ${ toTypescript(val, idt + 1) }`);
        return `{${ newline(idt + 1) + out.join(',' + newline(idt + 1)) + newline(idt) }}`;
    }

    return getType(obj)
}
const file = process.argv[0];
let data = '';

function error(message) { 
    console.error(message);

    console.log('');
    console.log('USAGE = jsonStructure.js <file> [--beautify]');
    console.log('');
    process.exit(1);
}

try {
    data = fs.readFileSync(file, { encoding: 'utf-8' });
} catch (err) {
    error('Couldn\'t read the file...')
}
try {
    data = JSON.parse(data);
} catch (err) {
    error('Couldn\'t parse the JSON...')
}

console.log(toTypescript(data));
