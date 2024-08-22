#!/bin/bun

import { SimpleGit, SimpleGitOptions, simpleGit } from "simple-git";
import CopilotSession from "./copilot/copilot";
import fs from "fs";
import path from 'path';

let gitRoot = process.cwd();

while (!fs.existsSync(gitRoot + "/.git")) {
  gitRoot = gitRoot.split("/").slice(0, -1).join("/");
  if (gitRoot === "") {
    console.error("No git repository found.");
    process.exit(1);
  }
}

const options: Partial<SimpleGitOptions> = {
  baseDir: process.cwd(),
  binary: "git",
  maxConcurrentProcesses: 6,
  trimmed: false,
};

const git: SimpleGit = simpleGit(options);

const status = await git.status();
const diff = await git.diff();
if (status.isClean()) {
  console.log("No changes to review.");
  process.exit(0);
}

const copilot = new CopilotSession();

copilot.coreInstructions = `
Your role is to generate a summary of the changes that have been made to the codebase.

Always group related changes together.
Be general in the summary, do not report every single change.

The user doesn't care about which exact files changed, he wants to know why these changes were made.
`;

if (status.not_added.length > 0) {
  let message = "Here are the files that have been added:";
  for (let file of status.not_added) {
    const fileContent = fs.readFileSync(path.join(gitRoot, file), "utf-8");
     
    message += `\n${file}:\n\`\`\`\n${fileContent}\n\`\`\`\n`;
  }

  copilot.addMessageToConversation(message, "system");
}

const modifiedFiles = status.modified.concat(status.staged);

copilot.addMessageToConversation(
  "Here are the files which have been modified:" + modifiedFiles.join("\n"),
  "system"
)
// copilot.addMessageToConversation(
//   "Here is the output of `git diff`: \n```diff\n" + diff + "\n```",
//   "system"
// );

copilot.dumpConversation();

const answer = await copilot.ask("Generate a summary of the changes.");

console.log(answer);
