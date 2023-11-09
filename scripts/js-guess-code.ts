#!/bin/bun

import clipboardy from 'clipboardy';
import { askAI } from './openai.js';

if (/js-guess-code.js/.test(process.argv[1])) {
    let content = '';
    let language = '';

    if (process.argv.length > 2) {
        language = process.argv[2];
    }

    content = clipboardy.readSync().replace(/\\n/g, '\n');

    if (!content) {
        process.exit(1);
    }

    const question = `
\`\`\`${language}
[...]
${content}
[...]
\`\`\`


What code should be written at the cursor position? ( #CURSOR# )

Make sure to keep the code clean and readable, adding comments if necessary.

The given code will be inserted at the cursor position. If the cursor is in a line, you should simply complete this line.
The resulting code should run without error.
`;

    // console.log(question);

    askAI(question.trim(), 'code').then(code => {
        code = code.replace(/^```\w*/, '').trim();
        while (code.startsWith('`')) code = code.slice(1);
        while (code.endsWith('`')) code = code.slice(0, -1);

        if (code) {
            console.log(code + '\n');
            clipboardy.writeSync(code + '\n');
        } else {
            console.log('Error...');
            clipboardy.writeSync('Error...');
        }
    });
}
