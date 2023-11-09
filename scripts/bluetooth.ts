#!/bin/bun

import prompts from 'prompts';
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
async function get_devices(
): Promise<{ id: string; name: string }[]> {
    const raw = await cmd('bluetoothctl devices');

    const out = [] as { name: string; id: string }[];

    raw.split('\n').forEach(line => {
        const id = line.split(/\s+/)[1];
        const name = line.split(/\s+/).slice(2).join(' ');

        if (/^[0-9A-F-]*$/.test(name)) return;

        out.push({ id, name });
    });

    return out;
}

async function reset_connection_with(device_id: string): Promise<void> {
    await cmd(`bluetoothctl untrust ${device_id}`);
    await cmd(`bluetoothctl remove ${device_id}`);
    await cmd(`bluetoothctl --timeout 5 scan on`);
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
    return prompts({
        type: 'autocomplete',
        name: 'res',
        initial: '',
        message: 'Pick a bluetooth device',
        choices: options.map(opt => ({ title: opt })),
    })
        .then(res => {
            return res.res;
        })
        .catch(() => {
            console.log('ERROR');
        });
}

async function sleep(time = 0.2) {
    return new Promise(resolve => {
        setTimeout(resolve, time * 1000);
    });
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
    if (!is_started) {
        await cmd('systemctl start bluetooth');
        await sleep(1);
    }

    let devices = await get_devices();
    console.log(devices.map(dev => dev.name));

    let stop = false;
    const loop = async () => {
        cmd(`bluetoothctl scan on`);
        while (true) {
            // Starting scan...
            await sleep(5)
            devices = await get_devices();
            if (stop) return;
            console.log(devices.map(dev => dev.name));
        }
    };

    loop();

    await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Hit enter when you see your device',
        initial: true,
    });

    stop = true;

    const choice_name = await fuzzy_select(devices.map(d => d.name));

    console.log(choice_name);

    const choice = devices.find(dev => dev.name === choice_name);
    try {
        const res = await connect_to(choice.id);
        console.log(res);
    } catch (err) {
        console.log(err.message);
    }
    process.exit(0);
}
