#!/bin/node
import { FuzzyFinder } from './cli.js';
import { exec } from 'child_process';
/**
 * Runs a shell command
 */
async function cmd(c) {
    return new Promise((resolve, reject) => {
        exec(c, (err, stdout, stderr) => {
            if (err)
                reject(err);
            if (!stdout && stderr)
                reject(stderr);
            resolve(stdout.trim());
        });
    });
}
async function is_bluetooth_started() {
    try {
        await cmd('systemctl status bluetooth');
        return true;
    }
    catch (err) {
        return false;
    }
}
/**
 * Returns the devices as {id: '1:1:1:1', name: 'Device'}
 *
 * @return {Promise<{id: string, name: string}>}
 */
async function get_devices() {
    const raw = await cmd('bluetoothctl devices');
    return raw.split('\n').map(line => ({
        id: line.split(/\s+/)[1],
        name: line.split(/\s+/).slice(2).join(' '),
    }));
}
/**
 * @param device_id {string}
 */
async function connect_to(device_id) {
    return cmd('bluetoothctl connect ' + device_id);
}
/**
 * @param options {string[]}
 */
async function fuzzy_select(options) {
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
}
start();
async function start() {
    const args = process.argv.slice(2);
    if (args.includes('--help')) {
        console.log("USAGE = 'bluetooth.js [on|off]'");
        console.log('    Can also be ran without argument to select bluetooth device to connect to');
        process.exit(0);
    }
    if (args.includes('on')) {
        await cmd('systemctl start bluetooth');
        process.exit(0);
    }
    if (args.includes('off')) {
        await cmd('systemctl stop bluetooth');
        process.exit(0);
    }
    const is_started = await is_bluetooth_started();
    if (!is_started)
        await cmd('systemctl start bluetooth');
    const devices = await get_devices();
    const choice_name = await fuzzy_select(devices.map(d => d.name));
    const choice = devices.find(dev => dev.name === choice_name);
    try {
        res = await connect_to(choice.id);
        console.log(res);
    }
    catch (err) {
        console.log(err.message);
    }
}
//# sourceMappingURL=bluetooth.js.map