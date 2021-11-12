#!/bin/node

import { fuzzyFind, FuzzyFinder } from './fuzzyFinder.js';
import { cmd } from './shell.js';

async function is_bluetooth_started() {
    try {
        await cmd('systemctl status bluetooth');
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Returns the devices as {id: '1:1:1:1', name: 'Device'}
 */
async function get_devices(): Promise<{ id: string; name: string }[]> {
    const raw = await cmd('bluetoothctl devices');
    return raw.split('\n').map(line => ({
        id: line.split(/\s+/)[1],
        name: line.split(/\s+/).slice(2).join(' '),
    }));
}

async function reset_connection_with(device_id: string): Promise<void> {
    await cmd(`bluetoothctl untrust ${device_id}`);
    await cmd(`bluetoothctl remove ${device_id}`);
    await cmd(`bluetoothctl --timeout 3 scan on`);
    const res = await cmd(`bluetoothctl connect ${device_id}`);
    await cmd(`bluetoothctl scan off`);
    console.log('res', res);
    if (res.includes('Failed')) {
        throw 'Connection with this device could not be established...';
    }
    if (res.includes('not available')) {
        throw 'Device is not available...';
    }
}

async function connect_to(device_id: string): Promise<string> {
    const res = await cmd('bluetoothctl connect ' + device_id);
    if (res.includes('Failed')) {
        try {
            await reset_connection_with(device_id);
        } catch (err) {
            return 'Could not connect to device...';
        }
    }
    return 'Connected to device.';
}

/**
 * @param options {string[]}
 */
async function fuzzy_select(options: string[]): Promise<string> {
    return fuzzyFind(options).then(choice => choice.label);
}

start();
async function start() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log("USAGE = 'bluetooth.js [on|off]'");
        console.log(
            '    Can also be ran without argument to select bluetooth device to connect to'
        );
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
    if (!is_started) await cmd('systemctl start bluetooth');

    const devices = await get_devices();
    const choice_name = await fuzzy_select(devices.map(d => d.name));
    const choice = devices.find(dev => dev.name === choice_name);
    try {
        const res = await connect_to(choice.id);
        console.log(res);
    } catch (err) {
        console.log(err.message);
    }
    process.exit(0);
}
