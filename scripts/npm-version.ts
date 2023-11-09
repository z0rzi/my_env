#!/bin/bun

import fs from 'fs';
import path from 'path';

const readJSON = (filepath: string) => JSON.parse(fs.readFileSync(filepath, 'utf8'))

let rootpath = path.resolve('.');

while (rootpath !== '/' && !fs.existsSync(path.join(rootpath, 'package.json'))) rootpath = path.dirname(rootpath)

if (rootpath === '/') {
    console.log('Could not find the package.json file...');
    process.exit(1);
}

console.log(rootpath);

const packagejson = readJSON(path.join(rootpath, 'package.json'));

const deps = packagejson['dependencies'];
const devDeps = packagejson['devDependencies'];

const out = {} as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
};

if (deps) {
    out['dependencies'] = {};
    for (const pack of Object.keys(deps)) {
        const _packJson = readJSON(path.join(rootpath, 'node_modules', pack, 'package.json'));
        const version = _packJson['version'];

        out['dependencies'][pack] = version;
    }
}

if (devDeps) {
    out['devDependencies'] = {};
    for (const pack of Object.keys(devDeps)) {
        const _packJson = readJSON(path.join(rootpath, 'node_modules', pack, 'package.json'));
        const version = _packJson['version'];

        out['devDependencies'][pack] = version;
    }
}

console.log(JSON.stringify(out, null, 2));
