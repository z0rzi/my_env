#!/bin/bun

import fs from "fs";
import * as Kitty from "./kitty.js";
import { cmd } from "./shell.js";
import { focusVimWindow } from "./x.js";

/**
 * @returns [window ID, process ID]
 */
async function findGoodVimInstance(
  vimPids: Set<number>
): Promise<[number, number] | null> {
  const kittyInfo = await Kitty.getFocussedTab();

  if (!kittyInfo) return null;

  const { tab: kittyTab, instance: kittyInstance } = kittyInfo;

  const i3WinId = kittyInstance.platform_window_id;

  // focussing the window
  await cmd("i3-msg [id=" + i3WinId + "] focus");

  for (const window of kittyTab.windows) {
    for (const process of window.foreground_processes) {
      if (vimPids.has(process.pid)) {
        // console.log('vim-signal:18\t> %o', window);
        // We found the vim instance which is in the active tab!
        return [window.id, process.pid];
      }
    }
  }

  return null;
}

export async function sendSignal(
  filePath: string,
  line?: number,
  col?: number
): Promise<number | null> {
  if (!line || isNaN(line)) line = 1;
  if (!col || isNaN(col)) col = 1;

  filePath += ":" + line + ":" + col;

  fs.writeFileSync("/tmp/vim_sig.txt", filePath);

  const vimPids = new Set(
    (await cmd("ps -C nvim -o pid=")).split("\n").map(Number)
  );
  const ids = await findGoodVimInstance(vimPids);

  if (ids) {
    // Sends the signal to vim
    // cmd('kill -USR1 ' + ids[1]);

    // Tryes to focuses the vim window
    try {
      await cmd("kitty @ focus-window --match=id:" + ids[1]);
    } catch (err) {
      console.log('Could not focus the vim window. Error: "%o"', err);
    }

    // Now, vim will react to the focus and read the file

    setTimeout(() => {
      // removing the file once it's been read by vim
      try {
        fs.unlinkSync("/tmp/vim_sig.txt");
      } catch (err) {
        // vim deleted the file on its own. No problem.
      }
    }, 500);

    return ids[0];
  } else {
    console.log("No vim instances found in the current kitty tab...");
    return null;
  }
}

if (process.argv[1].includes("vim-signal")) {
  const [file, line, col] = process.argv.slice(2);
  if (!file) {
    console.log('USAGE = "vim-signal.js <file>[:line[:col]]"');
    process.exit(1);
  }
  await focusVimWindow();
  sendSignal(file, +line, +col).then((wid) => {
    if (wid) console.log(wid);
  });
}
