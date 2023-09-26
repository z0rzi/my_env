var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
export function cmd(command, opts = {
    cutLines: false,
    trim: true,
    acceptFailure: false,
}) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
export function openFile(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            const child = child_process.spawn('rifle', [path], {
                stdio: 'inherit',
                windowsHide: false,
            });
            child.on('exit', function (e, code) {
                resolve();
            });
        });
    });
}
export function logInFile(obj, file = '/tmp/tmp.txt') {
    return __awaiter(this, void 0, void 0, function* () {
        let str = '';
        try {
            str = JSON.stringify(obj);
        }
        catch (err) {
            str = String(obj);
        }
        fs.writeFileSync(file, str);
    });
}
export function sourceCmd(cmd, args = []) {
    return __awaiter(this, void 0, void 0, function* () {
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
        return new Promise((resolve, reject) => {
            proc.on('exit', function (code) {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdin.removeListener('data', indata);
                proc.stdout.removeListener('data', outdata);
                resolve(code);
            });
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
    const proms = new Promise(resolve => resolve());
    let matchFound = false;
    const args = process.argv.slice(2);
    for (const arg of args) {
        for (const strRx of Object.keys(map)) {
            const rx = new RegExp(strRx);
            if (rx.test(arg)) {
                matchFound = true;
                const matchres = arg.match(rx);
                proms.then(() => map[strRx](arg, Object.assign({}, matchres.groups)));
                if (!opts.multiMatch)
                    return;
            }
        }
    }
    if (!matchFound && !!noMatchCb) {
        noMatchCb('', {});
    }
}
