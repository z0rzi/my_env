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
