#!/bin/bun
import fetch, { Headers } from 'node-fetch';
import * as UUID from 'uuid';
import path from 'path';
import fs from 'fs';
import { waitForInternet } from './network.js';

const home = process.env['HOME']!;

let API_TOKEN: string;

try {
    API_TOKEN = fs
        .readFileSync(path.join(home, '.config', 'wise-token.conf'))
        .toString()
        .trim();
} catch (err) {
    console.log(err);
    process.exit(0);
}

if (!API_TOKEN) {
    console.log('Could not find Wise API token');
    process.exit(1);
}

const headers = new Headers({
    Authorization: 'Bearer ' + API_TOKEN,
    'Content-Type': 'application/json',
});

type Profile = {
    id: number;
    type: 'PERSONAL' | 'BUSINESS';
    fullName: string;
};
type Balance = {
    id: number;
    currency: string;
    amount: {
        value: number;
        currency: string;
    };
};
type Movement = {
    id: number;
    type: 'CONVERSION';
    state: 'COMPLETED';
    balancesAfter: [
        {
            id: number;
            value: number;
            currency: string;
        },
        {
            id: number;
            value: number;
            currency: string;
        }
    ];
    sourceAmount: {
        value: number;
        currency: string;
    };
    targetAmount: {
        value: number;
        currency: string;
    };
    rate: number;
    feeAmounts: [
        {
            value: number;
            currency: string;
        }
    ];
};
type Quote = {
    id: number;
};

async function listProfiles(): Promise<Profile[]> {
    let res = await fetch('https://api.transferwise.com/v2/profiles', {
        headers,
    }).then(res => res.json());

    return res as Profile[];
}

async function createQuote(
    profileId: number,
    fromCurrency: string,
    toCurrency: string,
    amount: number
): Promise<Quote> {
    let res = await fetch(
        `https://api.transferwise.com/v3/profiles/${profileId}/quotes`,
        {
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
        }
    )
        .then(res => res.json())
        .catch(err => {
            console.log(err);
        });

    return res;
}

async function getBalances(
    profileId: number,
    type: 'STANDARD' | 'SAVINGS' = 'STANDARD'
): Promise<Balance[]> {
    let res = await fetch(
        `https://api.transferwise.com/v4/profiles/${profileId}/balances?types=${type}`,
        { headers }
    ).then(res => res.json());

    return res as Balance[];
}

async function moveToJar(
    profileId: number,
    amount: number,
    from: Balance,
    to: Balance
) {
    const uuid = UUID.v4();
    let res = await fetch(
        `https://api.transferwise.com/v2/profiles/${profileId}/balance-movements`,
        {
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
        }
    ).then(res => res.json());

    return res as Movement;
}

async function saveCents() {
    const profiles = await listProfiles();
    const personalProfile = profiles.find(p => p.type === 'PERSONAL');
    if (!personalProfile) {
        console.log('Coule not find personal profile...');
        process.exit(1);
    }
    const profileId = personalProfile.id;

    const balances = await getBalances(profileId, 'STANDARD');
    const jars = await getBalances(profileId, 'SAVINGS');

    for (const balance of balances) {
        const amount = balance.amount.value - Math.floor(balance.amount.value);
        if (amount <= 0) {
            console.log(`😞 Nothing to save for currency ${balance.currency}`);
            continue;
        }

        const jar = jars.find(jar => jar.currency === balance.currency);
        if (!jar) {
            console.log(
                `No jar could be found for currency ${balance.currency}... Skipping`
            );
            continue;
        }

        const transfer = await moveToJar(profileId, amount, balance, jar);

        console.log(
            '🎉 You saved ' +
                transfer.sourceAmount.value +
                ' ' +
                transfer.sourceAmount.currency
        );
    }
}

async function main() {
    if (process.argv.length <= 2) {
        console.log(`USAGE = "wise.js save-cents"`);
        console.log(`                 balances"`);
        process.exit(1);
    }

    switch (process.argv[2]) {
        case 'save-cents':
            await saveCents();
            break;
        case 'balances':
            const profiles = await listProfiles();
            for (const profile of profiles) {
                const balances = await getBalances(profile.id);
                console.log(profile.fullName);
                for (const balance of balances)
                    console.log(
                        '\t' +
                            balance.amount.value +
                            ' ' +
                            balance.amount.currency
                    );
                console.log();
            }
            break;
    }
}

if (/wise\.js$/.test(process.argv[1])) {
    waitForInternet().then(() => {
        main();
    });
}
