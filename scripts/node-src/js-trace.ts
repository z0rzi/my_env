#!/bin/env node

import { cmd } from './shell.js';
import fs from 'fs';
import kl from 'kleur';

const TRACE_FILE = '/tmp/js-trace.log';

const filesToIgnore = new Set([
    'Observable.ts',
    'Subscriber.ts',
    'innerSubscribe.ts',
    'Subject.ts',
    'subscribeToArray.ts',
    'filter.ts',
    'catchError.ts',
    'take.ts',
    'mergeMap.ts',
    'map.ts',
    'tap.ts',
    'finalize.ts',
    'core.js',
    'zone.js',
    'xhr.ts',
    'logger.service.ts',
    'error-handler.interceptor.ts',
]);

async function parseTrace(trace: string) {
    const lines = trace.split('\n').reverse();

    for (const line of lines) {
        const matches = /[a-z-./@_]+\.[jt]sx?/i.exec(line);

        if (matches && !filesToIgnore.has(matches[0])) {
            const idx = matches.index;
            const fileName = matches[0];
            const lineAfterFile = line.slice(idx + fileName.length);
            const lineMatch = lineAfterFile.match(/^:\d+(?::\d+)?/);

            if (lineMatch) {
                const lineNum = +lineMatch[0].match(/\d+/)![0];

                let filePath = '';
                if (fileName.startsWith('/')) {
                    filePath = fileName;
                } else {
                    filePath = await cmd(`fd ${fileName}`);
                }

                console.log(
                    '\n\n' + kl.bold(kl.blue(fileName)) + kl.green(lineMatch[0])
                );

                if (!!filePath.trim()) {
                    const res = await cmd(
                        `bat --color=always -pp ${filePath} -r ${lineNum - 1}:${
                            lineNum + 5
                        } -H ${lineNum}`
                    );
                    console.log(res);
                }
            } else {
                console.log(kl.bold(kl.blue(fileName)));
            }
        }
    }
}

cmd(`kitty --title floating nvim ${TRACE_FILE}`, { acceptFailure: true })
    .catch(() => {})
    .finally(() => {
        const trace = fs.readFileSync(TRACE_FILE, { encoding: 'utf8' });
        parseTrace(trace);
    });
