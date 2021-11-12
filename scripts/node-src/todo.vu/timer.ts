import fetch, { RequestInit } from 'node-fetch';
import { headers } from './auth.js';
import { Task } from './tasks.js';

export async function stopTimer(): Promise<unknown> {
    return fetch('https://zorzi.todo.vu/api/time/@rTimerStop', {
        headers: headers({ with_csrf_token: true }),
        method: 'PUT',
    } as RequestInit).then(res => {
        // console.log('res', res);
    });
}

export async function abortTimer(): Promise<unknown> {
    return fetch('https://zorzi.todo.vu/api/time/@rTimerDiscard', {
        headers: headers({ with_csrf_token: true }),
        method: 'PUT',
    } as RequestInit);
}

export async function updateCurrentTimerDescription(
    description: string
): Promise<unknown> {
    return fetch('https://zorzi.todo.vu/api/time/@rTimerSetDescription', {
        headers: headers({ with_csrf_token: true }),
        body: JSON.stringify({ description }),
        method: 'PUT',
    });
}

export async function startTimer(taskId: number): Promise<unknown> {
    return fetch('https://zorzi.todo.vu/api/time/@rTimerStart', {
        headers: headers({ with_csrf_token: true }),
        body: `{"task_id":"${taskId}"}`,
        method: 'PUT',
    } as RequestInit)
        .then(res => res.text())
        .then(res => {
            console.log('res', res);
        });
}

export async function getCurrentTimer(): Promise<{
    startedAt: Date;
    task: Task;
    description: string;
}> {
    return fetch('https://zorzi.todo.vu/api/time/@rTimersListing', {
        headers: headers({ with_csrf_token: true }),
        method: 'GET',
    })
        .then(res => res.json())
        .then(async res => {
            const timer = res.items[0];
            if (!timer) return null;
            return {
                startedAt: new Date(timer.timer_started),
                description: timer.timer_description,
                task: await Task.fromId(timer.timer_task_id),
            };
        });
}
