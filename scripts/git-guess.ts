#!/bin/bun

import { SimpleGit, SimpleGitOptions, simpleGit } from "simple-git";
import CopilotSession from "./copilot/copilot";
import fs from "fs";

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
You are a GIT expert. You have been asked to review the changes in the current branch.
Review the changes, and provide a summary of the changes.

Your answer should follow the following example:
\`\`\`
# 1 - Adding fonts
Adding the fonts Arial and Courier to the project for mass plot creation.

git add assets/fonts Dockerfile
git commit -m "[feat] - Adding fonts for mass plot creation"

=========================
# 2 - Fixing infinite loop
Fixing the infinite loop but during axis scaling. The loop was caused by the axis scaling function not returning the correct value.

git add src/axis.js
git commit -m "[fix] - Fixing infinite loop during axis scaling"

=========================
.....
\`\`\`

Try to create as little commits as possible, grouping related changes together.
Be general in the summary, do not report every single change.
`;

if (status.not_added.length > 0) {
  let message = "Here are the files that have been added:";
  for (let file of status.not_added) {
    const fileContent = fs.readFileSync(file, "utf-8");
     
    message += `\n${file}:\n\`\`\`\n${fileContent}\n\`\`\`\n`;
  }

  copilot.addMessageToConversation(message, "system");
}
copilot.addMessageToConversation(
  "Here's the output of `git diff`: \n```diff\n" + diff + "\n```",
  "system"
);

const answer = await copilot.ask("Generate a summary of the changes.");

console.log(answer);
