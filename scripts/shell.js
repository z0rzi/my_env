import { __awaiter } from "tslib";
import { exec } from "child_process";
const HOME = process.env['HOME'];
const CWD = process.env['PWD'];
const NO_ARGS_PROVIDED = process.argv.length <= 2;
export { HOME, CWD, NO_ARGS_PROVIDED };
/**
 * Runs a shell command
 *
 * @returns The result as 1 string
 */
export function cmd(command, cut_lines = false) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    if (err.message.includes('Command failed')) {
                        console.log("Failed while trying to execute the following command:");
                        console.log("");
                        console.log("    " + command);
                        console.log("");
                        console.log(err.message);
                        process.exit(1);
                    }
                    reject(err);
                }
                if (!stdout && stderr)
                    reject(stderr);
                if (!cut_lines)
                    resolve(stdout.trim());
                resolve(stdout.split('\n').map(line => line.trim()).filter(e => !!e));
            });
        });
    });
}
export function mapArgs(map, noMatchCb = null) {
    let matchFound = false;
    process.argv.slice(2).forEach(arg => {
        for (const strRx of Object.keys(map)) {
            const rx = new RegExp(strRx);
            if (rx.test(arg)) {
                matchFound = true;
                const matchres = arg.match(rx);
                map[strRx](arg, matchres.groups);
            }
        }
    });
    if (!matchFound) {
        noMatchCb();
    }
}
//# sourceMappingURL=shell.js.map