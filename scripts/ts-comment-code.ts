#!/bin/bun

import clipboardy from 'clipboardy';
import { askAI } from './openai.js';

if (/genJSDoc.js/.test(process.argv[1])) {
    let content = '';

    if (process.argv.length > 2) {
        content = process.argv.slice(2).join(' ');
    } else {
        content = clipboardy.readSync();
    }

    if (!content) {
        process.exit(1);
    }

    const question = `
Here's how I usually write my code comments:

\`\`\`
/**
 * Ajoute deux entiers
 *
 * @param n1 Le premier entier à ajouter
 * @param n2 Le deuxième entier à ajouter
 *
 * @returns La somme des deux paramètres
 */
function add(n1: number, n2: number): number {
    return n1 + n2;
}
\`\`\`
The \`@returns\` line is not required, only add it when relevant.
You can also add a \`@throws\` line if necessary to indicate thrown errors.

Write a comment for the following function in the same fashion:
\`\`\`
${content}
\`\`\`
`;

    askAI(question, 'comments').then(response => {
        const comment = response.match(/\/\*\*[\s\S]*\*\//);
        if (comment) {
            console.log(comment[0] + '\n');
            clipboardy.writeSync(comment[0] + '\n');
        } else {
            console.log('Error...');
            clipboardy.writeSync('Error...');
        }
    });
}
