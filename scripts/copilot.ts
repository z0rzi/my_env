#!/usr/bin/bun

import prompts from "prompts";
import CopilotSession from "./copilot/copilot";
import clipboardy from "clipboardy";
import kl from 'kleur'

const args = process.argv.slice(2);

let option = "-question";
let others = [] as string[];

for (const arg of args) {
  if (arg.startsWith("-")) {
    option = arg;
  } else {
    others.push(arg);
  }
}

function errorMissingArgument() {
  console.log("USAGE = copilot.ts <question>");
  console.log("                   -clip <question> (with code in clipboard)");
  console.log("                   -chat");
  process.exit(1);
}

const copilot = new CopilotSession();
if (option === "-question") {
  if (others.length === 0) {
    errorMissingArgument();
  }

  const question = others.join(" ");

  const answer = await copilot.ask(question);

  console.log(answer);
} else if (option === "-chat") {
  while (true) {
    const { question } = await prompts({
      type: "text",
      input: "question",
      name: "question",
      message: "User",
    });

    if (!question) {
      break;
    }

    const answer = await copilot.ask(question);

    console.log(kl.bold(kl.blue('\nCopilot > ')), answer);
    console.log('\n');
  }
} else if (option === "-clip") {
  let code = clipboardy.readSync().replace(/\\n/g, "\n");
  if (!code) {
    errorMissingArgument();
  }
  console.log(kl.blue('Analyzed code:'));
  console.log(code);
  console.log();
  console.log(kl.black('------------'));
  console.log();
  let message = others.join(" ");
  if (!message) {
    message = 'Explain this code to me:';
  }

  message += '\n```\n' + code + '\n```\n';


  const answer = await copilot.ask(message);

  console.log(answer);
}
