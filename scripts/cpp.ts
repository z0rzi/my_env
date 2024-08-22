#!/bin/bun

import path from "path";
import fs from "fs";
import { bunCmd } from "./shell";

if (process.argv.length <= 2) {
  console.log("\nCopy files, ignoring the `.gitignore` files");
  console.log("\n\tUSAGE = 'cpp.js <from> <to>'\n");
  process.exit(1);
}

const toPath = process.argv.pop() || "";
const fromPaths = process.argv.slice(2);

let destExists = fs.existsSync(toPath);

// dest should not exist
if (destExists && !fs.statSync(toPath).isDirectory()) {
  console.error(`'${toPath}' already exists and is not a directory...`);
  process.exit(1);
}

// Oringin should all exist
for (const fromPath of fromPaths) {
  if (!fs.existsSync(fromPath)) {
    console.error(`'${fromPath}' does not exist...`);
    process.exit(1);
  }
}

function parseFdOutput(output: string): { files: string[]; dirs: string[] } {
  const lines = output.split("\n").filter(Boolean);
  const files: string[] = [];
  const dirs: string[] = [];

  for (const line of lines) {
    if (line.endsWith("/")) dirs.push(line);
    else files.push(line);
  }

  return { files, dirs };
}

const absFromPaths = fromPaths.map((p) => path.resolve(p));

for (const fromPath of absFromPaths) {
  const rawRes = await bunCmd("fd . " + fromPath);
  const res = parseFdOutput(rawRes);
  console.log(res);

  // Creating all the directories
  for (const dir of res.dirs) {
    const relDir = dir.replace(fromPath, "");
    const destDir = path.join(toPath, relDir);
    console.log(`Creating directory '${destDir}'`);
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copying all the files
  for (const file of res.files) {
    const relFile = file.replace(fromPath, "");
    const destFile = path.join(toPath, relFile);
    console.log(`Copying file '${file}' to '${destFile}'`);
    fs.copyFileSync(file, destFile);
  }
}
