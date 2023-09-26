#!/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function parseTrace(trace) {
    return __awaiter(this, void 0, void 0, function* () {
        const lines = trace.split('\n').reverse();
        for (const line of lines) {
            const matches = /[a-z-./@_]+\.[jt]sx?/i.exec(line);
            if (matches && !filesToIgnore.has(matches[0])) {
                const idx = matches.index;
                const fileName = matches[0];
                const lineAfterFile = line.slice(idx + fileName.length);
                const lineMatch = lineAfterFile.match(/^:\d+(?::\d+)?/);
                if (lineMatch) {
                    const lineNum = +lineMatch[0].match(/\d+/)[0];
                    let filePath = '';
                    if (fileName.startsWith('/')) {
                        filePath = fileName;
                    }
                    else {
                        filePath = yield cmd(`fd ${fileName}`);
                    }
                    console.log('\n\n' + kl.bold(kl.blue(fileName)) + kl.green(lineMatch[0]));
                    if (!!filePath.trim()) {
                        const res = yield cmd(`bat --color=always -pp ${filePath} -r ${lineNum - 1}:${lineNum + 5} -H ${lineNum}`);
                        console.log(res);
                    }
                }
                else {
                    console.log(kl.bold(kl.blue(fileName)));
                }
            }
        }
    });
}
cmd(`kitty --title floating nvim ${TRACE_FILE}`, { acceptFailure: true })
    .catch(() => { })
    .finally(() => {
    const trace = fs.readFileSync(TRACE_FILE, { encoding: 'utf8' });
    parseTrace(trace);
});
