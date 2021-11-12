import { __awaiter } from "tslib";
import fetch from 'node-fetch';
import { headers } from './auth.js';
import { Task } from './tasks.js';
export function stopTimer() {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://zorzi.todo.vu/api/time/@rTimerStop', {
            headers: headers({ with_csrf_token: true }),
            method: 'PUT',
        }).then(res => {
            // console.log('res', res);
        });
    });
}
export function abortTimer() {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://zorzi.todo.vu/api/time/@rTimerDiscard', {
            headers: headers({ with_csrf_token: true }),
            method: 'PUT',
        });
    });
}
export function updateCurrentTimerDescription(description) {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://zorzi.todo.vu/api/time/@rTimerSetDescription', {
            headers: headers({ with_csrf_token: true }),
            body: JSON.stringify({ description }),
            method: 'PUT',
        });
    });
}
export function startTimer(taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://zorzi.todo.vu/api/time/@rTimerStart', {
            headers: headers({ with_csrf_token: true }),
            body: `{"task_id":"${taskId}"}`,
            method: 'PUT',
        })
            .then(res => res.text())
            .then(res => {
            console.log('res', res);
        });
    });
}
export function getCurrentTimer() {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch('https://zorzi.todo.vu/api/time/@rTimersListing', {
            headers: headers({ with_csrf_token: true }),
            method: 'GET',
        })
            .then(res => res.json())
            .then((res) => __awaiter(this, void 0, void 0, function* () {
            const timer = res.items[0];
            if (!timer)
                return null;
            return {
                startedAt: new Date(timer.timer_started),
                description: timer.timer_description,
                task: yield Task.fromId(timer.timer_task_id),
            };
        }));
    });
}
//# sourceMappingURL=timer.js.map