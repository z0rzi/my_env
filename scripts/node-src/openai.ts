#!/bin/node

import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import path from 'path';

const configuration = new Configuration({
    apiKey: fs
        .readFileSync(
            path.join(process.env['HOME']!, '.config', 'openapi-token.conf'),
            { encoding: 'utf8' }
        )
        .trim(),
});

const openai = new OpenAIApi(configuration);

/**
 * Request a response from the AI
 *
 * @param question    The question to ask the AI
 * @param maxTokens   The max amount of words returned by the AI
 *
 * @returns A string containing the AI's response
 *
 * @throws An error if the question is `null` or if the request fails
 */
export async function askAI(
    question: string,
    profile: 'code' | 'comments' | 'creative',
    maxTokens = 1000
) {
    let topP = 1;
    let temperature = 1;

    switch (profile) {
        case 'comments':
            temperature = 0.3;
            topP = 0.2;
            break;
        case 'code':
            temperature = 0.2;
            topP = 0.1;
            break;
        case 'creative':
            temperature = 0.6;
            topP = 0.7;
            break;
        default:
            temperature = 0.2;
            topP = 0.1;
            break;
    }

    return openai
        .createCompletion({
            model: 'text-davinci-003',
            prompt: question,
            temperature,
            top_p: topP,
            max_tokens: maxTokens,
        })
        .then(response => {
            const textRes = response.data.choices[0].text!.trim();
            return textRes;
        })
        .catch(err => {
            console.error(err.message);
            return '';
        });
}
if (/openai.js/.test(process.argv[1])) {
    let content = process.argv.slice(2).join(' ');

    if (!content) {
        content = 'Give me a good joke.';
    }

    askAI(content, 'creative').then(response => {
        console.log(response);
    });
}
