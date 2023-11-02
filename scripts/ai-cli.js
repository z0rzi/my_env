#!/bin/node
import clipboardy from 'clipboardy';
import { askAI } from './openai.js';
if (/ai-cli.js/.test(process.argv[1])) {
    const content = process.argv.slice(2).join(' ');
    if (!content) {
        console.log('Usage: ai-cli.js <command>');
        process.exit(1);
    }
    const question = `
You are a CLI (Command Line Interface) assistant. Your job is to help users write commands on their command lines.
Sometimes, the user can ask you to build a command, using english language, or sometimes, they will need help understanding a command.
When mentioning a command, use the follwing format :
$ command
or
$ command --option

---

Help the user with the following request :
\`\`\`fish
${content}
\`\`\`
`;
    askAI(question.trim(), 'code').then(resp => {
        if (resp) {
            console.log(resp + '\n');
            clipboardy.writeSync(resp + '\n');
        }
        else {
            console.log('Error...');
            clipboardy.writeSync('Error...');
        }
    });
}
