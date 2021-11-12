import { __awaiter } from "tslib";
import fetch from 'node-fetch';
import { headers } from './auth.js';
export class Client {
}
Client.from = (obj) => Object.assign(new Client(), obj);
function getClients() {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://zorzi.todo.vu/api/clients', {
            headers: headers(),
            method: 'GET',
        })
            .then(r => r.json())
            .then(res => {
            return res.items.map(item => Client.from(item));
        });
    });
}
//# sourceMappingURL=clients.js.map