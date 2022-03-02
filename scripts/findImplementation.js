#!/bin/node
import fs from 'fs';
import path from 'path';
import { NO_ARGS_PROVIDED } from './shell.js';
import './String.js';
var InfoType;
(function (InfoType) {
    InfoType[InfoType["OTHER_FILE"] = 0] = "OTHER_FILE";
    InfoType[InfoType["IMPLEMENTATION"] = 1] = "IMPLEMENTATION";
    InfoType[InfoType["NONE"] = 2] = "NONE";
})(InfoType || (InfoType = {}));
class TsFinder {
    getInfos(line, pos) {
        const word = line.wordAtPos(pos);
        console.log('line', line);
        if (new RegExp(`(private|public|class|interface|enum|type|let|const|var|function)\\s*${word}`).test(line)) {
            return { type: InfoType.IMPLEMENTATION };
        }
        if (new RegExp(`import .*${word}.*from`).test(line)) {
            const matches = line.match(/from\s*['"`](?<path>.*)['"`]/);
            if (!matches) {
                // Could not find file...
                return { type: InfoType.NONE };
            }
            return { type: InfoType.OTHER_FILE, info: matches.groups['path'] };
        }
        return { type: InfoType.NONE };
    }
    chooseFileAmong(fileNames) {
        const rxs = [/^index.ts/, /^index.js/, /.*\.d\.ts/, /.*\.ts/, /.*\.js/];
        for (const rx of rxs) {
            for (const name of fileNames) {
                if (rx.test(name)) {
                    return name;
                }
            }
        }
        return fileNames[0];
    }
    resolvePath(filePath, searchPath) {
        const fileDir = filePath.replace(/\/[^\/]*$/, '');
        // Is it in the node_modules?
        let nodeRoot = fileDir;
        while (!fs.existsSync(path.resolve(nodeRoot, 'node_modules'))) {
            nodeRoot = path.resolve(nodeRoot, '..');
        }
        const maybePath = path.resolve(nodeRoot, 'node_modules', searchPath);
        if (fs.existsSync(maybePath)) {
            if (fs.lstatSync(maybePath).isFile())
                return maybePath;
            // It's a directory...
            const kids = fs.readdirSync(maybePath, {
                encoding: 'utf8',
                withFileTypes: true,
            });
            const kidsNames = kids
                .filter(kid => kid.isFile())
                .map(kid => kid.name);
            return path.resolve(this.chooseFileAmong(kidsNames));
        }
        return '';
    }
}
function getFinderForFile(path) {
    const ext = path.replace(/^.*\./, '');
    switch (ext) {
        case 'ts':
            return new TsFinder();
    }
    throw new Error(`File ${path} does not match any known finder`);
}
class Searcher {
    constructor(path) {
        this.filePath = '';
        this.content = [];
        this.filePath = path;
        this.content = fs.readFileSync(path).toString().split(/\n/g);
    }
    wordAtPos(line, col) {
        if (this.content.length <= line)
            return '';
        const lineText = this.content[line];
        return lineText.wordAtPos(col);
    }
    findWord(word) {
        const rx = new RegExp('\\b' + word + '\\b', 'g');
        const out = [];
        let lineNum = 0;
        while (lineNum < this.content.length) {
            const lineStr = this.content[lineNum];
            const res = rx.exec(lineStr);
            if (!!res) {
                out.push({
                    line: lineNum,
                    col: res.index,
                });
            }
            lineNum++;
        }
        return out;
    }
    findImplementation(word) {
        word = word.trim();
        if (!word)
            return null;
        const finder = getFinderForFile(this.filePath);
        const positions = this.findWord(word);
        for (const pos of positions) {
            const infos = finder.getInfos(this.content[pos.line], pos.col);
            console.log('infos', infos);
            if (infos.type === InfoType.IMPLEMENTATION) {
                process.exit(0);
            }
            if (infos.type === InfoType.OTHER_FILE) {
                const newPath = finder.resolvePath(this.filePath, infos.info);
                if (newPath) {
                    const s = new Searcher(newPath);
                    console.log('New Path: %s', newPath);
                    return s.findImplementation(word);
                }
            }
        }
        return {
            path: '',
            col: 0,
            line: 0,
        };
    }
}
if (/findImplementation\.js$/.test(process.argv[1])) {
    if (NO_ARGS_PROVIDED) {
        process.exit(1);
    }
    const raw = process.argv[2];
    const [path, line, col] = raw.split(':');
    const s = new Searcher(path);
    const word = s.wordAtPos(Number(line) - 1, Number(col));
    console.log(s.findImplementation(word));
}
function pos(line, pos) {
    throw new Error('Function not implemented.');
}
