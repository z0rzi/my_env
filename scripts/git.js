import { cmd } from "./shell.js";
/**
 * Returns all the unstaged files
 */
export async function getUnstaged() {
    return getRootPath()
        .then(root => {
        return cmd(`git ls-files -m --full-name ${root}`, true);
    });
}
export async function getBranches() {
    return cmd('git branch', true);
}
export async function getFilesDiff(commit1, commit2) {
    return cmd(`git diff --name-only ${commit1} ${commit2}`, true);
}
export async function cwdInGitDir() {
    return new Promise(async (resolve, reject) => {
        return getRelativePath()
            .then(() => resolve())
            .catch(() => reject(new Error('Not in a git dir!')));
    });
}
export async function getRootPath() {
    return cwdInGitDir()
        .then(() => {
        return cmd('git rev-parse --show-toplevel');
    });
}
/**
 * Gives the current path relative to the git root
 */
export async function getRelativePath() {
    return cmd('git rev-parse --show-prefix')
        .then(path => {
        return path || '/';
    });
}
//# sourceMappingURL=git.js.map