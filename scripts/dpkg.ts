#!/usr/bin/bun

import fs from "fs";
import kl from "kleur";

if (!process.argv[2]) {
  console.log(kl.red("USAGE = dpkg.ts [removed|installed]"));
  process.exit(1);
}

const logFile = "/var/log/dpkg.log";
const rawLogs = fs.readFileSync(logFile, "utf8");

const now = Date.now();

const oneDay = 1000 * 60 * 60 * 24;

const removedPackages = [] as string[];
const installedPackages = [] as string[];

for (const log of rawLogs.split("\n")) {
  const [rawDate, rawHour, action, packageName] = log.split(" ");
  if (!packageName) continue;

  const date = new Date(rawDate + "T" + rawHour + "Z");

  const [pack, version] = packageName.split(":");

  if (action === "purge" || action == "remove") {
    // only keeping actions from the last 24h
    if (now - +date > oneDay) continue;

    removedPackages.push(pack);
  } else if (action === "install") {
    // only keeping actions from the last 30 days
    // if (now - +date > oneDay * 30) continue;

    installedPackages.push(pack);
  }
}

if (process.argv[2] === "installed") {
  console.log(kl.blue(kl.bold("# Packages installed in the last 30 days:")));
  console.log(installedPackages.join("\n"));
} else if (process.argv[2] === "removed") {
  console.log(kl.blue(kl.bold("# Packages removed in the last 24 hours:")));
  console.log(removedPackages.join(" "));
}
