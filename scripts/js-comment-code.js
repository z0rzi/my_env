#!/bin/node
import clipboardy from 'clipboardy';
import { askAI } from './openai.js';
if (/js-comment-code.js/.test(process.argv[1])) {
    let content = '';
    if (process.argv.length > 2) {
        content = process.argv.slice(2).join(' ');
    }
    else {
        content = clipboardy.readSync();
    }
    if (!content) {
        process.exit(1);
    }
    const question = `
Ajoute des commentaires au code suivant afin de le rendre plus compréhensible, sans modifier le code :
\`\`\`
${content}
\`\`\`
`;
    askAI(question.trim(), 'comments').then(commentedText => {
        if (commentedText) {
            console.log(commentedText + '\n');
            clipboardy.writeSync(commentedText.trim());
        }
        else {
            console.log('Error...');
            clipboardy.writeSync('Error...');
        }
    });
}
