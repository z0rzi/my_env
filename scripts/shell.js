import child_process from 'child_process';
import fs from 'fs';
const HOME = process.env['HOME'];
const CWD = process.env['PWD'];
const NO_ARGS_PROVIDED = process.argv.length <= 2;
export { HOME, CWD, NO_ARGS_PROVIDED };
export { NO_MATCH_FOUND };
/**
 * Runs a shell command
 *
 * @returns The result as 1 string
 */
export async function cmd(command, opts = {
    cutLines: false,
    trim: true,
    acceptFailure: false,
}) {
    opts = Object.assign({
        cutLines: false,
        trim: true,
        acceptFailure: false,
    }, opts);
    return new Promise((resolve, reject) => {
        child_process.exec(command, (err, stdout, stderr) => {
            if (!!stdout) {
                if (!opts.cutLines)
                    return resolve(stdout.trim());
                return resolve(stdout
                    .split('\n')
                    .map(line => (opts ? line.trim() : line))
                    .filter(e => !!e));
            }
            if (stderr)
                return reject(stderr);
            if (err) {
                if (err.message.includes('Command failed') &&
                    !opts.acceptFailure) {
                    console.log('Failed while trying to execute the following command:');
                    console.log('');
                    console.log('    ' + command);
                    console.log('');
                    console.log(err.message);
                    process.exit(1);
                }
                return reject(err);
            }
            return resolve('');
        });
    });
}
export async function openFile(path) {
    return new Promise(resolve => {
        const child = child_process.spawn('rifle', [path], {
            stdio: 'inherit',
            windowsHide: false,
        });
        child.on('exit', function (e, code) {
            resolve();
        });
    });
}
export async function logInFile(obj, file = '/tmp/tmp.txt') {
    let str = '';
    try {
        str = JSON.stringify(obj);
    }
    catch (err) {
        str = String(obj);
    }
    fs.writeFileSync(file, str);
}
export async function sourceCmd(cmd, args = []) {
    const proc = child_process.spawn(cmd, args);
    function indata(c) {
        proc.stdin.write(c);
    }
    function outdata(c) {
        process.stdout.write(c);
    }
    process.stdin.resume();
    process.stdin.on('data', indata);
    proc.stdout.on('data', outdata);
    process.stdin.setRawMode(true);
    return new Promise((resolve, reject) => {
        proc.on('exit', function (code) {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', indata);
            proc.stdout.removeListener('data', outdata);
            resolve(code);
        });
    });
}
const NO_MATCH_FOUND = '__no_matches__';
export function mapArgs(map, opts = {
    multiMatch: true,
}) {
    let noMatchCb = null;
    if (NO_MATCH_FOUND in map)
        noMatchCb = map[NO_MATCH_FOUND];
    let matchFound = false;
    process.argv.slice(2).forEach(arg => {
        for (const strRx of Object.keys(map)) {
            const rx = new RegExp(strRx);
            if (rx.test(arg)) {
                matchFound = true;
                const matchres = arg.match(rx);
                map[strRx](arg, matchres.groups);
                if (!opts.multiMatch)
                    return;
            }
        }
    });
    if (!matchFound && !!noMatchCb) {
        noMatchCb('', {});
    }
}
//# sourceMappingURL=shell.js.map