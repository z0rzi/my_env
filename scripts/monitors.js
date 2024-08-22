#!/bin/bun

const CONF_FILE = '/home/zorzi/.config/monitors.json';

import { cmd, sourceCmd } from './shell.js';
import { readFileSync, readFile, writeFile } from 'fs';
import { createHash as hash } from 'crypto';
let laptop = null;

let config;
try {
    config = readFileSync(CONF_FILE, 'utf8');
    try {
        config = JSON.parse(config);
    } catch (err) {
        console.log('The config file could not be parsed...');
        console.log('Check for errors yourself: ' + CONF_FILE);
        process.exit(1);
    }
} catch (err) {
    config = {};
}

/**
 * Creates a md5 hash
 */
function md5(str) {
    return hash('md5').update(str, 'utf8').digest('hex');
}

/**
 * Finds file in a directory
 */
async function findFiles(dir, fileName) {
    return cmd(`find ${dir} -name "${fileName}" 2> /dev/null || exit 0`);
}

/**
 * Returns the hexadecimal content of a file
 */
async function hexRead(filePath) {
    return cmd(`xxd -p ${filePath}`).then(res => {
        return res.replace(/\s+/g, '');
    });
}

/**
 * Retreives all the plugged monitors, according to Xrandr
 */
async function getXrandrMonitorsNames() {
    return cmd("xrandr | grep '\\bconnected'").then(res =>
        res.split('\n').map(line => line.split(/\s+/).shift())
    );
}

/**
 * Retreives all the disconected monitors, according to Xrandr
 */
async function getXrandrDisconnectedMonitorsNames() {
    return cmd("xrandr | grep '\\bdisconnected'", { acceptFailure: true })
        .then(res => res.split('\n').map(line => line.split(/\s+/).shift()))
        .catch(() => []);
}

/**
 * Retreives the available sound cards
 *
 * @return Promise<{{index: number, profiles: {name: string, priority: number}[]}[]}>
 */
async function getSoundCards() {
    return cmd('pacmd list-cards').then(cards => {
        cards = cards.split(/index: /g);
        cards = cards.map(card => {
            let index = card.match(/^\s*\d/);
            if (index) index = Number(index[0]);
            let profiles = card.match(/(?:output|input):[^\n]+/g) || [];
            profiles = profiles
                .map(profile => {
                    let priority = profile.match(/priority (\d+)/);
                    if (!!priority) priority = Number(priority[1]);
                    else priority = 0;
                    return {
                        name: profile.replace(/: .*$/, ''),
                        priority,
                    };
                })
                .sort((a, b) => b.priority - a.priority);
            return { index, profiles };
        });
        return cards.filter(card => card.profiles.length);
    });
}

/**
 * Runs the sound commands
 */
async function setSoundProfileFor(monitor) {
    console.log(await getSoundCards());
    for (const card of await getSoundCards()) {
        console.log(card);
        let profile = '';
        if (monitor.isLaptop() || !monitor.config.sound) {
            // no HDMI
            profile = card.profiles.find(
                profile => !profile.name.toLowerCase().includes('hdmi')
            );
            if (!profile) profile = card.profiles[0];
        } else {
            // HDMI
            profile = card.profiles.find(profile =>
                profile.name.toLowerCase().includes('hdmi')
            );
            if (!profile) profile = card.profiles[0];
        }
        cmd(`pacmd set-card-profile ${card.index} ${profile.name}`);
    }
}

/**
 * Represents a Monitor, might be a TV, an external monitor, or the laptop screen
 */
class Monitor {
    /**
     * @param {string} hash The hash identifier of this monitor
     * @param {string} name The name of the monitor, according to the `/sys` directory
     * @param {string} folder The path of the folder containing the monitor infos
     */
    constructor(hash, name, folder) {
        this.name = name;
        this.hash = hash;
        this.folder = folder;

        if (this.isLaptop()) this.hash = 'laptop';

        if (!(this.hash in config)) config[this.hash] = {};

        config[this.hash] = {
            alias: config[this.hash].alias || 'New monitor',
            side: config[this.hash].side || 'same',
            primary: config[this.hash].primary || false,
            dimensions: config[this.hash].dimensions || '',
            sound: config[this.hash].sound || false,
            cmd: config[this.hash].cmd || '',
        };

        this.config = config[this.hash];
    }

    /**
     * Retreives the name of this monitor, according to Xrandr. This is not the same
     * name as `this.name`, for some reason...
     */
    async getXrandrName() {
        return getXrandrMonitorsNames().then(names => {
            return names.find(
                name =>
                    name
                        .replace(/-.*/, '')
                        .replace(/[^a-zA-Z]/g, '')
                        .toLowerCase() ===
                    this.name
                        .replace(/-.*/, '')
                        .replace(/[^a-zA-Z]/g, '')
                        .toLowerCase()
            );
        });
    }

    /**
     * Retreives the available modes ( =dimensions ) of this monitor
     */
    async getModes() {
        return new Promise((resolve, reject) => {
            readFile(this.folder + '/modes', 'utf8', (err, modes) => {
                if (err) reject(err);
                modes = modes.trim().split(/\s+/);
                modes = modes.reduce(
                    (acc, mode, idx) =>
                        modes.indexOf(mode) === idx ? [...acc, mode] : acc,
                    []
                );
                resolve(modes);
            });
        });
    }

    /**
     * Is this the laptop screen?
     */
    isLaptop() {
        return this.name.includes('eDP');
    }

    /**
     * Runs the commands to setup the configuration for this monitor.
     */
    async executeConfig() {
        if (this.config.cmd) return cmd(this.config.cmd);

        let command = 'xrandr ';
        const disconnected = await getXrandrDisconnectedMonitorsNames();
        if (disconnected && disconnected.length) {
            disconnected.forEach(name => {
                command += `--output ${name} --off `;
            });
        }
        if (this.isLaptop()) {
            command += `--output ${await this.getXrandrName()} --auto --primary --rotate normal `;
        } else {
            const laptopName = await laptop.getXrandrName();
            command += `--output ${laptopName} --auto --rotate normal `;
            command += this.config.primary ? '' : '--primary ';
            if (laptop.config.dimensions)
                command += `--mode ${this.config.dimensions} `;

            command += `--output ${await this.getXrandrName()} --auto --rotate normal `;
            command += this.config.primary ? '--primary ' : '';
            if (this.config.dimensions)
                command += `--mode ${this.config.dimensions} `;
            command +=
                {
                    same: '--same-as ',
                    right: '--right-of ',
                    left: '--left-of ',
                    top: '--above ',
                    bottom: '--below ',
                }[this.config.side] + laptopName;
        }

        setSoundProfileFor(this);

        console.log('cmd', command);

        return cmd(command);
    }
}

/**
 * Saves the updated config (global variable) to the conf file
 *
 * @param {string} currentHash The hash of the plugged monitor, or the laptop hash if
 *                             no monitor plugged. Used to put it in first place in
 *                             the conf file.
 */
async function updateConfig(currentHash) {
    let sortedProps = Object.keys(config).sort((a, b) => {
        if (b === currentHash) return 1;
        if (a === currentHash) return -1;
        return 0;
    });
    sortedProps = [...sortedProps, ...Object.keys(laptop.config)];
    writeFile(CONF_FILE, JSON.stringify(config, sortedProps, 4), err => {
        if (err) console.error('err', err);
        else console.log('config updated');
    });
}

/**
 * Returns the plugged monitors
 *
 * @return {Monitor[]} The monitors
 */
async function getMonitors() {
    return findFiles('/sys/devices', 'edid')
        .then(async files => {
            files = files.split('\n').filter(file => file);
            const monitors = [];
            for (const file of files) {
                let name = file.match(/card\d\/card\d-(?<name>[^/]+)/);
                try {
                    name = name.groups.name;
                } catch (err) {
                    name = '';
                }
                const hexa = await hexRead(file);
                if (hexa) {
                    monitors.push(
                        new Monitor(
                            md5(hexa),
                            name,
                            file.replace(/\/[^/]*$/, '')
                        )
                    );
                }
            }
            return monitors;
        })
        .catch(err => console.error(err));
}

getMonitors().then(async monitors => {
    console.log(monitors);
    laptop = monitors.find(mon => mon.isLaptop());
    if (monitors.length > 1) monitors = monitors.filter(mon => !mon.isLaptop());

    const monitor = monitors[0];

    let args = process.argv.slice(2);

    if (args.includes('--get-hash')) {
        console.log(monitor.hash);
        process.exit(0);
    }

    if (args.includes('--get-alias')) {
        console.log(monitor.config.alias);
        process.exit(0);
    }

    if (args.includes('--edit')) {
        console.log(
            'The current configuration is the 1st one in the config file.'
        );
        console.log('Here are the available dimensions: ');
        console.log(await monitor.getModes());
        cmd(`kitty nvim ${CONF_FILE}`)
            .then(() => {
                console.log('Done!');
                cmd('monitors.js');
            })
            .catch(err => {
                console.log('err', err);
            });
        return;
    }

    try {
        await monitor.executeConfig();
        await getSoundCards();
    } catch (err) {
        console.error('err', err);
    }

    updateConfig(monitor.hash);
});
