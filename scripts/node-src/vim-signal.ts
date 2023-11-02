#!/bin/env node

import fs from 'fs';
import * as Kitty from './kitty.js';
import { cmd } from './shell.js';

/**
 * @returns [window ID, process ID]
 */
async function findGoodVimInstance(vimPids: Set<number>): Promise<[number, number] | null> {
    const kittyTab = await Kitty.getFocussedTab();

    if (!kittyTab) return null;

    for (const window of kittyTab.windows) {
        for (const process of window.foreground_processes) {
            if (vimPids.has(process.pid)) {
                // We found the vim instance which is in the active tab!
                return [window.id, process.pid];
            }
        }
    }

    return null;
}

export async function sendSignal(filePath: string, line?: number, col?: number): Promise<number | null> {
    if (!line || isNaN(line)) line = 1;
    if (!col || isNaN(col)) col = 1;

    filePath += ':' + line + ':' + col;

    fs.writeFileSync('/tmp/vim_sig.txt', filePath);

    const vimPids = new Set((await cmd('ps -C nvim -o pid=')).split('\n').map(Number));
    const ids = await findGoodVimInstance(vimPids);

    if (ids) {
        // Sends the signal to vim
        // cmd('kill -USR1 ' + ids[1]);

        // Focuses the vim window
        cmd('kitty @ focus-window --match=id:' + ids[0]);

        // Now, vim will react to the focus and read the file

        setTimeout(() => {
            // removing the file once it's been read by vim
            fs.unlinkSync('/tmp/vim_sig.txt');
        }, 500);

        return ids[0];
    } else {
        console.log('No vim instances found in the current kitty tab...');
        return null;
    }
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
