#!/bin/env node

import wifi from 'node-wifi';

import prompts from 'prompts';

wifi.init({
    iface: 'wlo1',
});

// Scan networks
wifi.scan()
    .then(networks => {
        const ssids = networks.map(net => ({ title: net.ssid }));

        prompts({
            type: 'autocomplete',
            name: 'ssid',
            message: 'Pick a wifi network',
            choices: ssids,
        }).then(({ ssid }: { ssid: string }) => {
            const net = networks.find(net => net.ssid === ssid);

            console.log(net);

            wifi.connect({ ssid: net.ssid, password: '' }, () => {
                console.log('\n\nConnected');
                process.exit(0);
            });
        });
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
