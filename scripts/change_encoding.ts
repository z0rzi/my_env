#!/bin/bun

import { $ } from 'bun';
import fs from 'fs/promises';

const file = process.argv[2];
const encoding = process.argv[3] || 'utf-8';

if (!await fs.stat(file).then(() => true).catch(() => false)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

const output = await $`file --mime-encoding ${file}`.text();
const oldEncoding = output.split(': ')[1].trim();

await $`iconv -f ${oldEncoding} -t ${encoding} ${file} > ${file}.tmp`;
await $`mv ${file} /tmp/${file}`;
await $`mv ${file}.tmp ${file}`

console.log(`The file has been converted from ${oldEncoding} to ${encoding}.`);
console.log(`The initial file has been moved to /tmp/${file}.`);
