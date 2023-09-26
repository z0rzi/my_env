#!/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import * as Kitty from './kitty.js';
import { cmd } from './shell.js';
/**
 * @returns [window ID, process ID]
 */
function findGoodVimInstance(vimPids) {
    return __awaiter(this, void 0, void 0, function* () {
        const kittyTab = yield Kitty.getFocussedTab();
        if (!kittyTab)
            return null;
        for (const window of kittyTab.windows) {
            for (const process of window.foreground_processes) {
                if (vimPids.has(process.pid)) {
                    // We found the vim instance which is in the active tab!
                    return [window.id, process.pid];
                }
            }
        }
        return null;
    });
}
export function sendSignal(filePath, line, col) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!line || isNaN(line))
            line = 1;
        if (!col || isNaN(col))
            col = 1;
        filePath += ':' + line + ':' + col;
        fs.writeFileSync('/tmp/vim_sig.txt', filePath);
        const vimPids = new Set((yield cmd('ps -C nvim -o pid=')).split('\n').map(Number));
        const ids = yield findGoodVimInstance(vimPids);
        if (ids) {
            cmd('kill -10 ' + ids[1]);
            return ids[0];
        }
        else {
            console.log('No vim instances found in the current kitty tab...');
            return null;
        }
    });
}
if (process.argv[1].includes('vim-signal')) {
    const [file, line, col] = process.argv.slice(2);
    if (!file) {
        console.log('USAGE = "vim-signal.js <file>[:line[:col]]"');
        process.exit(1);
    }
    sendSignal(file, +line, +col).then((wid) => {
        if (wid)
            console.log(wid);
    });
}
