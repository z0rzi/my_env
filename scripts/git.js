import { __awaiter } from "tslib";
import { cmd } from "./shell.js";
/**
 * Returns all the unstaged files
 */
export function getUnstaged() {
    return __awaiter(this, void 0, void 0, function* () {
        return getRootPath()
            .then(root => {
            return cmd(`git ls-files -m --full-name ${root}`, true);
        });
    });
}
export function getBranches() {
    return __awaiter(this, void 0, void 0, function* () {
        return cmd('git branch', true);
    });
}
export function getFilesDiff(commit1, commit2) {
    return __awaiter(this, void 0, void 0, function* () {
        return cmd(`git diff --name-only ${commit1} ${commit2}`, true);
    });
}
export function cwdInGitDir() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            return getRelativePath()
                .then(() => resolve())
                .catch(() => reject(new Error('Not in a git dir!')));
        }));
    });
}
export function getRootPath() {
    return __awaiter(this, void 0, void 0, function* () {
        return cwdInGitDir()
            .then(() => {
            return cmd('git rev-parse --show-toplevel');
        });
    });
}
/**
 * Gives the current path relative to the git root
 */
export function getRelativePath() {
    return __awaiter(this, void 0, void 0, function* () {
        return cmd('git rev-parse --show-prefix')
            .then(path => {
            return path || '/';
        });
    });
}
//# sourceMappingURL=git.js.map