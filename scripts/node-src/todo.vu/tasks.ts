import fetch from 'node-fetch';

import { headers } from './auth.js';
import { Client } from './clients.js';
import { HtmlNode } from '../html.js';

export class Task {
    id: number;
    name: string;
    client: Client;
    last_modified: Date;
    time_budget: number;
    total_duration: number;

    static from = (obj: any) => {
        const task = Object.assign(new Task(), obj);
        task.client = Client.from(obj.client);
        task.last_modified = new Date(obj.last_modified_metadata);
        task.name = new HtmlNode(`<div>${task.name}</div>`).innerText;
        return task;
    };

    static async fromId(id: number): Promise<Task> {
        return fetch('https://zorzi.todo.vu/fetch/tasks', {
            headers: headers({ with_csrf_token: true }),
            method: 'PUT',
            body: JSON.stringify({
                ids: [String(id)],
                fields: [
                    'name',
                    'details',
                    'client_id',
                    'project_id',
                    'creator_id',
                    'time_budget',
                    'total_duration',
                ],
            }),
        })
            .then(res => res.json())
            .then(res => {
                return Task.from(res[0]);
            });
    }

    toString(): string {
        return `#${this.id.toString().padStart(2, '0')} - ${this.name}`;
    }
}
async function getAllTasksIds(): Promise<number[]> {
    return fetch('https://zorzi.todo.vu/api/tasks', {
        headers: headers(),
        method: 'GET',
    })
        .then(res => res.json())
        .then(res => {
            const tasks = [];
            for (const filter of res.items) tasks.push(...filter.items);

            return tasks.map(task => task.id);
        });
}
export async function getTasks(): Promise<Task[]> {
    return fetch('https://zorzi.todo.vu/fetch/tasks', {
        headers: headers({ with_csrf_token: true }),
        method: 'PUT',
        body: JSON.stringify({
            ids: await getAllTasksIds(),
            fields: [
                'name',
                'details',
                'client_id',
                'project_id',
                'creator_id',
                'time_budget',
                'total_duration',
            ],
        }),
    })
        .then(res => res.json())
        .then(res => {
            return res.map(task => Task.from(task));
        });
}
