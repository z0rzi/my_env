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
import fetch, { Headers } from 'node-fetch';
import * as UUID from 'uuid';
import path from 'path';
import fs from 'fs';
import { waitForInternet } from './network.js';
const home = process.env['HOME'];
let API_TOKEN;
try {
    API_TOKEN = fs
        .readFileSync(path.join(home, '.config', 'wise-token.conf'))
        .toString()
        .trim();
}
catch (err) { }
if (!API_TOKEN) {
    console.log('Could not find Wise API token');
    process.exit(1);
}
const headers = new Headers({
    Authorization: 'Bearer ' + API_TOKEN,
    'Content-Type': 'application/json',
});
function listProfiles() {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield fetch('https://api.transferwise.com/v2/profiles', {
            headers,
        }).then(res => res.json());
        return res;
    });
}
function createQuote(profileId, fromCurrency, toCurrency, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield fetch(`https://api.transferwise.com/v3/profiles/${profileId}/quotes`, {
            headers,
            method: 'POST',
            body: JSON.stringify({
                sourceCurrency: fromCurrency,
                targetCurrency: toCurrency,
                sourceAmount: amount,
                targetAmount: null,
                payOut: 'BALANCE',
                preferredPayIn: null,
            }),
        })
            .then(res => res.json())
            .catch(err => {
            console.log(err);
        });
        return res;
    });
}
function getBalances(profileId, type = 'STANDARD') {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield fetch(`https://api.transferwise.com/v4/profiles/${profileId}/balances?types=${type}`, { headers }).then(res => res.json());
        return res;
    });
}
function moveToJar(profileId, amount, from, to) {
    return __awaiter(this, void 0, void 0, function* () {
        const uuid = UUID.v4();
        let res = yield fetch(`https://api.transferwise.com/v2/profiles/${profileId}/balance-movements`, {
            method: 'POST',
            headers: new Headers({
                Authorization: 'Bearer ' + API_TOKEN,
                'Content-Type': 'application/json',
                'X-idempotence-uuid': uuid,
            }),
            body: JSON.stringify({
                amount: {
                    value: amount,
                    currency: from.currency,
                },
                sourceBalanceId: from.id,
                targetBalanceId: to.id,
                quoteId: null,
            }),
        }).then(res => res.json());
        return res;
    });
}
function saveCents() {
    return __awaiter(this, void 0, void 0, function* () {
        const profiles = yield listProfiles();
        const personalProfile = profiles.find(p => p.type === 'PERSONAL');
        if (!personalProfile) {
            console.log('Coule not find personal profile...');
            process.exit(1);
        }
        const profileId = personalProfile.id;
        const balances = yield getBalances(profileId, 'STANDARD');
        const jars = yield getBalances(profileId, 'SAVINGS');
        for (const balance of balances) {
            const amount = balance.amount.value - Math.floor(balance.amount.value);
            if (amount <= 0) {
                console.log(`😞 Nothing to save for currency ${balance.currency}`);
                continue;
            }
            const jar = jars.find(jar => jar.currency === balance.currency);
            if (!jar) {
                console.log(`No jar could be found for currency ${balance.currency}... Skipping`);
                continue;
            }
            const transfer = yield moveToJar(profileId, amount, balance, jar);
            console.log('🎉 You saved ' +
                transfer.sourceAmount.value +
                ' ' +
                transfer.sourceAmount.currency);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.argv.length <= 2) {
            console.log(`USAGE = "wise.js save-cents"`);
            console.log(`                 balances"`);
            process.exit(1);
        }
        switch (process.argv[2]) {
            case 'save-cents':
                yield saveCents();
                break;
            case 'balances':
                const profiles = yield listProfiles();
                for (const profile of profiles) {
                    const balances = yield getBalances(profile.id);
                    console.log(profile.fullName);
                    for (const balance of balances)
                        console.log('\t' +
                            balance.amount.value +
                            ' ' +
                            balance.amount.currency);
                    console.log();
                }
                break;
        }
    });
}
if (/wise\.js$/.test(process.argv[1])) {
    waitForInternet().then(() => {
        main();
    });
}
