#!/bin/node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import prompts from 'prompts';
import { cmd } from './shell.js';
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
 */
function get_devices() {
    return __awaiter(this, void 0, void 0, function* () {
        const raw = yield cmd('bluetoothctl devices');
        const out = [];
        raw.split('\n').forEach(line => {
            const id = line.split(/\s+/)[1];
            const name = line.split(/\s+/).slice(2).join(' ');
            if (/^[0-9A-F-]*$/.test(name))
                return;
            out.push({ id, name });
        });
        return out;
    });
}
function reset_connection_with(device_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield cmd(`bluetoothctl untrust ${device_id}`);
        yield cmd(`bluetoothctl remove ${device_id}`);
        yield cmd(`bluetoothctl --timeout 5 scan on`);
        const res = yield cmd(`bluetoothctl connect ${device_id}`);
        yield cmd(`bluetoothctl scan off`);
        console.log('res', res);
        if (res.includes('Failed')) {
            throw 'Connection with this device could not be established...';
        }
        if (res.includes('not available')) {
            throw 'Device is not available...';
        }
    });
}
function connect_to(device_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield cmd('bluetoothctl connect ' + device_id);
        if (res.includes('Failed')) {
            try {
                yield reset_connection_with(device_id);
            }
            catch (err) {
                return 'Could not connect to device...';
            }
        }
        return 'Connected to device.';
    });
}
/**
 * @param options {string[]}
 */
function fuzzy_select(options) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function sleep(time = 0.2) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            setTimeout(resolve, time * 1000);
        });
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
        if (!is_started) {
            yield cmd('systemctl start bluetooth');
            yield sleep(1);
        }
        let devices = yield get_devices();
        console.log(devices.map(dev => dev.name));
        let stop = false;
        const loop = () => __awaiter(this, void 0, void 0, function* () {
            cmd(`bluetoothctl scan on`);
            while (true) {
                // Starting scan...
                yield sleep(5);
                devices = yield get_devices();
                if (stop)
                    return;
                console.log(devices.map(dev => dev.name));
            }
        });
        loop();
        yield prompts({
            type: 'confirm',
            name: 'value',
            message: 'Hit enter when you see your device',
            initial: true,
        });
        stop = true;
        const choice_name = yield fuzzy_select(devices.map(d => d.name));
        console.log(choice_name);
        const choice = devices.find(dev => dev.name === choice_name);
        try {
            const res = yield connect_to(choice.id);
            console.log(res);
        }
        catch (err) {
            console.log(err.message);
        }
        process.exit(0);
    });
}
