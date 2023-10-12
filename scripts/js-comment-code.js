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
    content = content.trim();
    let contentWithLines = ' 1 | ' + content;
    let i = 2;
    contentWithLines = contentWithLines.replace(/\n/g, () => {
        return '\n' + String(i++).padStart(2, ' ') + ' | ';
    });
    const question = `
Here's my code:

\`\`\`
${contentWithLines}
\`\`\`

Comment the complicated parts of the above code in french using the following JSON format:

[
    {
      "comment": "Mise à jour de la Base de données",
      "line": 43
    },
    {
      "comment": "Tri de la liste par ordre alphabétique",
      "line": 95
    },
    {
      "comment": "Récupération des noms de compteurs",
      "line": 115
    },
    ...
]
`;
    function parseReply(reply) {
        while (reply.length && !reply.startsWith('[')) {
            reply = reply.slice(1);
        }
        while (reply.length && !reply.endsWith(']')) {
            reply = reply.slice(0, -1);
        }
        try {
            return JSON.parse(reply);
        }
        catch (err) {
            return [];
        }
    }
    askAI(question.trim(), 'comments').then(commentedText => {
        if (commentedText) {
            const comments = parseReply(commentedText);
            comments.sort(({ line: line1 }, { line: line2 }) => line2 - line1);
            const splittedContent = content.split(/\n/g);
            function getLineIndent(lineNum) {
                try {
                    return splittedContent[lineNum - 1].match(/^\s*/g)[0];
                }
                catch (err) { }
                try {
                    return splittedContent[lineNum].match(/^\s*/g)[0];
                }
                catch (err) { }
                return '';
            }
            for (const { comment, line } of comments) {
                const indent = getLineIndent(line);
                splittedContent.splice(line - 1, 0, indent + '// ' + comment.trim());
            }
            const commentedCode = splittedContent.join('\n');
            console.log(commentedCode);
            clipboardy.writeSync(commentedCode);
        }
        else {
            console.log('Error...');
            clipboardy.writeSync('Error...');
        }
    });
}
