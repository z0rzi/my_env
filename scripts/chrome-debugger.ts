#!/bin/bun

import kl from 'kleur';
import CDP from 'chrome-remote-interface';

// https://chromedevtools.github.io/devtools-protocol/

function time(d: Date | number) {
    if (typeof d === 'number') d = new Date(d);
    d.setUTCMinutes(d.getUTCMinutes() - d.getTimezoneOffset());
    return (
        d.getUTCHours().toString().padStart(2, '0') +
        ':' +
        d.getUTCMinutes().toString().padStart(2, '0')
    );
}

function message(timestamp: number, type: string, content: string) {
    content = content.replace(/\/?[a-zA-Z-_]*\/\S*\.[tj]s\b/, (match) => {
        return kl.red(kl.italic(match));
    });
    console.log(
        kl.italic(kl.gray(time(timestamp))) +
            ' - ' +
            kl.green('[' + type + '] ') +
            kl.dim(content)
    );
}

type Awaited<T> = T extends Promise<infer U> ? U : never;

async function example() {
    let client: Awaited<ReturnType<typeof CDP>>;
    try {
        // connect to endpoint
        client = await CDP();

        const { Log, Debugger, Runtime } = client;

        await Log.enable();
        await Debugger.enable();
        await Runtime.enable();

        Log.on('entryAdded', ({ entry: log }) => {
            if (log.level === 'error') {
                message(log.timestamp, log.source, kl.red(log.text));
            } else {
                message(log.timestamp, log.source, log.text);
            }
        });

        Runtime.on('consoleAPICalled', async log => {
            message(
                log.timestamp,
                log.type,
                log.args.map(arg => arg.value).join(' ')
            );
            if (log.type === 'error') {
                for (const arg of log.args.slice(1)) {
                    console.log('  ' + arg.description.replace(/\n/g, '\n  '));
                }
            }
        });

        Runtime.on('exceptionThrown', except => {
            message(
                except.timestamp,
                'err',
                except.exceptionDetails.text
            );
            console.log(except.exceptionDetails.url);
            console.log(except.exceptionDetails.lineNumber);
        });

        // Pauses execution of the code
        // Debugger.pause();
    } catch (err) {
        console.error(err);
    } finally {
        process.once('SIGINT', function () {
            client.close();
            process.exit(0);
        });
    }
}

example();
