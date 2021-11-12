#!/bin/node
import { __awaiter } from "tslib";
import { login } from './todo.vu/auth.js';
import { getTasks } from './todo.vu/tasks.js';
import { getCurrentTimer, startTimer, abortTimer, stopTimer, updateCurrentTimerDescription, } from './todo.vu/timer.js';
function errorMessage() {
    console.log('\n' +
        'USAGE = "todo.js | start <task_id> (<description>)"\n' +
        '                 | stop"\n' +
        '                 | rename <description>"\n' +
        '                 | ls | ps | list"\n');
    process.exit(1);
}
function handleStart() {
    return __awaiter(this, void 0, void 0, function* () {
        const taskId = (process.argv[3] || '').replace(/[^\d]/g, '');
        if (!taskId)
            errorMessage();
        yield startTimer(Number(taskId));
        const description = process.argv[4] || '';
        if (description)
            yield updateCurrentTimerDescription(description);
    });
}
function handleStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield getCurrentTimer();
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
    });
}
function handleRename() {
    return __awaiter(this, void 0, void 0, function* () {
        const description = process.argv[3] || '';
        if (description)
            yield updateCurrentTimerDescription(description);
        else
            errorMessage();
    });
}
function handleAbort() {
    return __awaiter(this, void 0, void 0, function* () {
        yield abortTimer();
    });
}
function handleStop() {
    return __awaiter(this, void 0, void 0, function* () {
        stopTimer();
    });
}
function handleList() {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = yield getTasks();
        console.log(tasks.map(t => t.toString()).join('\n'));
    });
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
if (!foundFunc)
    errorMessage();
//# sourceMappingURL=todo.js.map