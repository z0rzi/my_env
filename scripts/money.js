#!/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { cmd } from './shell.js';
import fs from 'fs';
import kl from 'kleur';
function err(message) {
    console.log(kl.red(message));
    process.exit(1);
}
const TRACE_FILE = '/tmp/js-trace.log';
function parseAccounts(raw) {
    return __awaiter(this, void 0, void 0, function* () {
        const lines = raw.split(/\n/g);
        let sum = 0;
        // Lines can be of 2 forms:
        //   - Lena paid 12 for Gaz
        //   - 12 to Lena for Gaz
        lines.forEach((line) => {
            if (!line.trim())
                return;
            let matches = line.match(/[0-9.,]+/);
            if (!matches)
                err(`Could not find the amount paid in the line '${line}'`);
            let amount = +matches[0].replace(/,/g, '.');
            let paying = '';
            let reason = '';
            if (/\bpaid\b|\bspent\b/.test(line)) {
                amount /= 2;
                if (/L\w*\s+(paid|spent)/.test(line)) {
                    // Lena paid
                    sum -= amount;
                    paying = 'B';
                }
                else if (/B\w*\s+(paid|spent)/.test(line)) {
                    // Baptiste paid
                    sum += amount;
                    paying = 'L';
                }
                else {
                    err(`Could not understand who paid in the line '${line}'`);
                }
            }
            else if (/\bto\b/.test(line)) {
                if (/to L\w*/.test(line)) {
                    // money to Lena
                    sum -= amount;
                    paying = 'B';
                }
                else if (/to B\w*/.test(line)) {
                    // money to Baptiste
                    sum += amount;
                    paying = 'L';
                }
                else {
                    err(`Could not understand who paid in the line '${line}'`);
                }
            }
            if (!paying)
                err(`Could not understand who paid in the line '${line}'`);
            if (/\b(?:for|in)\b/.test(line)) {
                reason = line.replace(/^.*(?:for|in\b)/, '');
            }
            let sentence = kl.red(paying) + ' has to pay ' + kl.green(amount + '€');
            if (reason)
                sentence += ' for ' + kl.blue(reason.trim());
            console.log(sentence);
        });
        console.log();
        if (sum < 0) {
            console.log(kl.red('B') + ' owes ' + kl.green(-sum.toFixed(2) + '€') + ' to ' + kl.red('L'));
        }
        else {
            console.log(kl.red('L') + ' owes ' + kl.green(sum.toFixed(2) + '€') + ' to ' + kl.red('B'));
        }
    });
}
cmd(`kitty --title floating nvim ${TRACE_FILE}`, { acceptFailure: true })
    .catch(() => { })
    .finally(() => {
    const raw = fs.readFileSync(TRACE_FILE, { encoding: 'utf8' });
    parseAccounts(raw);
});
