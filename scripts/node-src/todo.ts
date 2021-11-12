#!/bin/node

import { login } from './todo.vu/auth.js';
import { getTasks } from './todo.vu/tasks.js';
import {
    getCurrentTimer,
    startTimer,
    abortTimer,
    stopTimer,
    updateCurrentTimerDescription,
} from './todo.vu/timer.js';

function errorMessage() {
    console.log(
        '\n' +
            'USAGE = "todo.js | start <task_id> (<description>)"\n' +
            '                 | stop"\n' +
            '                 | rename <description>"\n' +
            '                 | ls | ps | list"\n'
    );
    process.exit(1);
}

async function handleStart() {
    const taskId = (process.argv[3] || '').replace(/[^\d]/g, '');
    if (!taskId) errorMessage();
    await startTimer(Number(taskId));
    const description = process.argv[4] || '';
    if (description) await updateCurrentTimerDescription(description);
}

async function handleStatus() {
    const res = await getCurrentTimer();
    if (!res) {
        console.log('No started timers');
        return;
    }

    let time = String(res.startedAt.getHours()).padStart(2, '0');
    time += ':';
    time += String(res.startedAt.getMinutes()).padStart(2, '0');

    console.log(`==: ${res.description} :==`);
    console.log('');
    console.log(res.task.toString());
    console.log('');
    console.log(`Started at: ${time}`);
}

async function handleRename() {
    const description = process.argv[3] || '';
    if (description) await updateCurrentTimerDescription(description);
    else errorMessage();
}

async function handleAbort() {
    await abortTimer();
}
async function handleStop() {
    stopTimer();
}
async function handleList() {
    const tasks = await getTasks();
    console.log(tasks.map(t => t.toString()).join('\n'));
}

const maps = {
    start: handleStart,
    stop: handleStop,
    rename: handleRename,
    'abort|del|cancel': handleAbort,
    's|status': handleStatus,
    'ls|ps|list': handleList,
};

let foundFunc = false;
for (const [rx, fn] of Object.entries(maps)) {
    if (new RegExp(`^(?:${rx})$`).test(process.argv[2])) {
        foundFunc = true;
        login().then(() => {
            fn();
        });
        break;
    }
}

if (!foundFunc) errorMessage();
