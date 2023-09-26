#!/bin/node

import clipboardy from 'clipboardy';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import path from 'path';

const configuration = new Configuration({
    apiKey: fs.readFileSync(
        path.join(process.env['HOME'], '.config', 'openapi-token.conf'),
        { encoding: 'utf8' }
    ).trim(),
});

const openai = new OpenAIApi(configuration);

if (/improve-code.js/.test(process.argv[1])) {
    let content = '';

    if (process.argv.length > 2) {
        content = process.argv.slice(2).join(' ');
    } else {
        content = clipboardy.readSync();
    }

    if (!content) {
        process.exit(1);
    }

    openai
        .createCompletion({
            model: 'text-davinci-003',
            prompt: `Improve the following code: \n\n\`\`\`${content}\`\`\``,
            temperature: 0.3,
            max_tokens: 1000,
        })
        .then(response => {
            console.log(response.data.choices[0].text.trim());
            clipboardy.writeSync(response.data.choices[0].text.trim());
        })
        .catch(err => {
            console.error(err);
        });
}
