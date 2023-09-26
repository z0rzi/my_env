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
import kl from 'kleur';
import CDP from 'chrome-remote-interface';
// https://chromedevtools.github.io/devtools-protocol/
function time(d) {
    if (typeof d === 'number')
        d = new Date(d);
    d.setUTCMinutes(d.getUTCMinutes() - d.getTimezoneOffset());
    return (d.getUTCHours().toString().padStart(2, '0') +
        ':' +
        d.getUTCMinutes().toString().padStart(2, '0'));
}
function message(timestamp, type, content) {
    content = content.replace(/\/?[a-zA-Z-_]*\/\S*\.[tj]s\b/, (match) => {
        return kl.red(kl.italic(match));
    });
    console.log(kl.italic(kl.gray(time(timestamp))) +
        ' - ' +
        kl.green('[' + type + '] ') +
        kl.dim(content));
}
function example() {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        try {
            // connect to endpoint
            client = yield CDP();
            const { Log, Debugger, Runtime } = client;
            yield Log.enable();
            yield Debugger.enable();
            yield Runtime.enable();
            Log.on('entryAdded', ({ entry: log }) => {
                if (log.level === 'error') {
                    message(log.timestamp, log.source, kl.red(log.text));
                }
                else {
                    message(log.timestamp, log.source, log.text);
                }
            });
            Runtime.on('consoleAPICalled', (log) => __awaiter(this, void 0, void 0, function* () {
                message(log.timestamp, log.type, log.args.map(arg => arg.value).join(' '));
                if (log.type === 'error') {
                    for (const arg of log.args.slice(1)) {
                        console.log('  ' + arg.description.replace(/\n/g, '\n  '));
                    }
                }
            }));
            Runtime.on('exceptionThrown', except => {
                message(except.timestamp, 'err', except.exceptionDetails.text);
                console.log(except.exceptionDetails.url);
                console.log(except.exceptionDetails.lineNumber);
            });
            // Pauses execution of the code
            // Debugger.pause();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            process.once('SIGINT', function () {
                client.close();
                process.exit(0);
            });
        }
    });
}
example();
