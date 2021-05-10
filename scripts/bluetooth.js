#!/bin/node
import { __awaiter } from "tslib";
import { FuzzyFinder } from './cli.js';
import { exec } from 'child_process';
/**
 * Runs a shell command
 */
function cmd(c) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            exec(c, (err, stdout, stderr) => {
                if (err)
                    reject(err);
                if (!stdout && stderr)
                    reject(stderr);
                resolve(stdout.trim());
            });
        });
    });
}
function is_bluetooth_started() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield cmd('systemctl status bluetooth');
            return true;
        }
        catch (err) {
            return false;
        }
    });
}
/**
 * Returns the devices as {id: '1:1:1:1', name: 'Device'}
 *
 * @return {Promise<{id: string, name: string}>}
 */
function get_devices() {
    return __awaiter(this, void 0, void 0, function* () {
        const raw = yield cmd('bluetoothctl devices');
        return raw.split('\n').map(line => ({
            id: line.split(/\s+/)[1],
            name: line.split(/\s+/).slice(2).join(' '),
        }));
    });
}
/**
 * @param device_id {string}
 */
function connect_to(device_id) {
    return __awaiter(this, void 0, void 0, function* () {
        return cmd('bluetoothctl connect ' + device_id);
    });
}
/**
 * @param options {string[]}
 */
function fuzzy_select(options) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const fufi = new FuzzyFinder(options.map(opt => ({ label: opt, tags: opt })), (choice) => resolve(choice.label));
        });
        // try {
        //     await cmd(
        //         `kitty bash -c "echo -e '${options.join(
        //             '\n'
        //         )}' | fzf > /tmp/.bluetooth.txt"`
        //     );
        // } catch (err) {
        //     // nothing to worry about
        // }
        // const choosen = await cmd('cat /tmp/.bluetooth.txt');
        // return choosen;
    });
}
start();
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        if (args.includes('--help')) {
            console.log("USAGE = 'bluetooth.js [on|off]'");
            console.log('    Can also be ran without argument to select bluetooth device to connect to');
            process.exit(0);
        }
        if (args.includes('on')) {
            yield cmd('systemctl start bluetooth');
            process.exit(0);
        }
        if (args.includes('off')) {
            yield cmd('systemctl stop bluetooth');
            process.exit(0);
        }
        const is_started = yield is_bluetooth_started();
        if (!is_started)
            yield cmd('systemctl start bluetooth');
        const devices = yield get_devices();
        const choice_name = yield fuzzy_select(devices.map(d => d.name));
        const choice = devices.find(dev => dev.name === choice_name);
        try {
            res = yield connect_to(choice.id);
            console.log(res);
        }
        catch (err) {
            console.log(err.message);
        }
    });
}
//# sourceMappingURL=bluetooth.js.map