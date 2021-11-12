import fetch from 'node-fetch';
import { headers } from './auth.js';

export class Client {
    id: number;
    name: string;

    static from = (obj: any) => Object.assign(new Client(), obj);
}

async function getClients(): Promise<Client[]> {
    return fetch('https://zorzi.todo.vu/api/clients', {
        headers: headers(),
        method: 'GET',
    })
        .then(r => r.json())
        .then(res => {
            return res.items.map(item => Client.from(item));
        });
}
