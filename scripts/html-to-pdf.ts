#!/bin/bun

import * as pdf from "html-pdf";
import * as path from "path";
import fs from "fs/promises";

let outpath = "";
let htmlpath = "";

const args = process.argv.slice(2);

while (args.length) {
  const arg = args.shift();
  if (!arg) continue;

  if (arg === "--out" || arg === "-o") {
    outpath = args.shift()!;
  } else {
    if (await fs.exists(arg)) htmlpath = arg;
  }
}

if (!htmlpath || !outpath) {
  console.error("Usage: html-to-pdf -o <output.pdf> <input.html>");
  process.exit(1);
}

const html = await fs.readFile(process.argv[2], "utf-8");

const pdfOptions = {
  format: "A3",
  orientation: "portrait",
  border: "20mm",
  header: {
    height: "0mm",
    contents: "",
  },
  footer: {
    height: "10mm",
    contents: `
        <div style="float: right">{{page}} / {{pages}}</div>
        `,
  },
} as pdf.CreateOptions;

pdf
  .create(html, pdfOptions)
  .toFile(outpath, (err, buffer) => {
    if (err) {
      console.error(err);
      return new Response("Failed to create PDF!");
    }
  });
