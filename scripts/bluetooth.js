#!/bin/node
import { __awaiter } from "tslib";
import { fuzzyFind } from './fuzzyFinder.js';
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
        return raw.split('\n').map(line => ({
            id: line.split(/\s+/)[1],
            name: line.split(/\s+/).slice(2).join(' '),
        }));
    });
}
function reset_connection_with(device_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield cmd(`bluetoothctl untrust ${device_id}`);
        yield cmd(`bluetoothctl remove ${device_id}`);
        yield cmd(`bluetoothctl --timeout 3 scan on`);
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
        return fuzzyFind(options).then(choice => choice.label);
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
            const res = yield connect_to(choice.id);
            console.log(res);
        }
        catch (err) {
            console.log(err.message);
        }
        process.exit(0);
    });
}
//# sourceMappingURL=bluetooth.js.map