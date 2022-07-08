#!/bin/node

import { readFileSync } from 'fs';

process.argv.shift();
process.argv.shift();

if (!process.argv.length) {
    console.error('No file provided!');
    process.exit(1);
}

const minify = process.argv.indexOf('--minify') >= 0;
const tsCompatible = process.argv.indexOf('--ts') >= 0;
let MAX_ARR_SIZE = 20;
if (process.argv.indexOf('--full') >= 0)
    MAX_ARR_SIZE = 10000;


function getType(obj) {
    if (obj === null)
        return 'null'
    if (obj instanceof Date)
        return 'Date';
    if (Array.isArray(obj))
        return 'Array';
    if (typeof obj === 'string') {
        if (!isNaN(new Date(obj).getTime()))
            return 'Date'
        try {
            JSON.parse(obj)
            return 'json';
        } catch (err) {
        }
    }

    return typeof obj;
}

function newline(lvl) {
    if (!minify)
        return '\n' + '  '.repeat(lvl);
    else
        return '';
}

function toTypescript(obj, idt = 0) {
    const objType = getType(obj);

    if (objType === 'Array') {
        const firstType = getType(obj[0]);
        const childs = [];
        if (obj.every(elem => getType(elem) === firstType)) {
            if (firstType !== 'object')
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
            )).join(',' + newline(idt + 1))

            return `{${ newline(idt + 1) + str + newline(idt) }}[] /* x${ obj.length } */`;
        } else {
            // Different types in the array
            obj.forEach(elem => {
                const str = toTypescript(elem, idt + 1);
                if (!childs.includes(str))
                    childs.push(str);
            })
            return `[(${ newline(idt + 1) + childs.join(' | ') + newline(idt) })]`;
        }
    }
    if (objType === 'object') {
        const out = []
        const entries = Object.entries(obj);
        for (const [key, val] of entries.slice(0, MAX_ARR_SIZE))
            out.push(`${ key }: ${ toTypescript(val, idt + 1) }`);
        return '{'
            + newline(idt + 1)
            + out.join(',' + newline(idt + 1))
            + (entries.length > MAX_ARR_SIZE
                ? newline(idt + 1) + '/* + ' + (entries.length - MAX_ARR_SIZE) + ' more */'
                : ''
            )
            + newline(idt) + '}';
    }
    if (objType === 'json') {
        if (tsCompatible) return 'string /* json */';
        const js = JSON.parse(obj)
        return `/* START_JSON_STR { */${ newline(idt + 1) + toTypescript(js, idt + 1) + newline(idt) }/* } END_JSON_STR */`;
    }

    return objType
}
const file = process.argv[0];
let data = '';

function error(message) {
    console.error(message);

    console.log('');
    console.log('USAGE = jsonStructure.js <file> [--minify] [--ts] [--full]');
    console.log('');
    process.exit(1);
}

try {
    data = readFileSync(file, { encoding: 'utf-8' });
} catch (err) {
    error('Couldn\'t read the file...')
}
try {
    data = JSON.parse(data);
} catch (err) {
    error('Couldn\'t parse the JSON...')
}

console.log(
    'type A = ' + toTypescript(data)
);
