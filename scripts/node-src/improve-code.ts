#!/bin/node

import clipboardy from 'clipboardy';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
    apiKey: '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',
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
            max_tokens: 1000
        })
        .then((response) => {
            console.log(response.data.choices[0].text.trim());
            clipboardy.writeSync(response.data.choices[0].text.trim());
        })
        .catch((err) => {
            console.error(err);
        });
}
