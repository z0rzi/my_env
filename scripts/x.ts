#!/bin/bun

import fs from "fs";

import { bunCmd } from "./shell.js";

/**
 * Gives the Window ID of the currently focussed window
 */
export async function getCurrentWinId() {
  return bunCmd(
    "xprop -root | grep _NET_ACTIVE_WINDOW | awk '{print $5}' | head -n1"
  ).then((res) => {
    return res.trim();
  });
}

export async function focusWindow(winId: string) {
  return bunCmd(`xdotool windowactivate ${winId}`);
}

export async function getVisibleTerminalIds() {
  return bunCmd("xdotool search --onlyvisible --class kitty").then((res) => {
    return res.trim().split("\n");
  });
}

/**
 * Finds the window ID of the terminal containing a visible VIM instance
 */
async function findVimWindowId() {
  const allProcessesRaw = await bunCmd("ps -e -o pid,cmd --forest");
  const allProcessesLines = allProcessesRaw.split("\n").reverse();

  let vimFound = false;

  for (const line of allProcessesLines) {
    if (vimFound) {
      if (/\d  \\_ kitty\b/.test(line)) {
        const pid = +line.trim().split(" ")[0];
        const winId = await bunCmd(`xdotool search --pid ${pid} --onlyvisible`);
        fs.appendFileSync("/tmp/vim.log", `${pid} ${winId}\n`);
        if (winId.trim()) {
          fs.appendFileSync("/tmp/vim.log", `Found win: ${winId}\n`);
          return winId.trim();
        }
        vimFound = false;
      }
    }
    if (/_ n?vim\b/.test(line)) {
      console.log("x:34\t> %o", line);
      vimFound = true;
    }
  }

  return "";
}

/**
 * Focuses the first visible kitty window where vim is running, and returns the window ID
 */
export async function focusVimWindow() {
  fs.appendFileSync("/tmp/vim.log", `Focus win...\n`);
  const wid = await findVimWindowId();
  await focusWindow(wid);
}

if (process.argv[1].endsWith("x.ts")) {
  await focusVimWindow();
}
