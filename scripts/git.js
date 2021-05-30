import fs from 'fs';
import { parsePath, toAbsolutePath } from './files.js';
import { cmd } from './shell.js';
class GitCache {
    constructor() {
        this._gitRoots = [];
    }
    static getInstance() {
        if (!GitCache._instance)
            GitCache._instance = new GitCache();
        return GitCache._instance;
    }
    addGitRoot(path) {
        path = toAbsolutePath(path);
        if (this._gitRoots.includes(path))
            this._gitRoots.push(path);
    }
    getGitRoot(path) {
        path = toAbsolutePath(path);
        for (const root of this._gitRoots) {
            if (path.startsWith(root)) {
                return root;
            }
        }
        return '';
    }
}
export var GitFileState;
(function (GitFileState) {
    GitFileState[GitFileState["NONE"] = 0] = "NONE";
    GitFileState[GitFileState["MODIFIED"] = 1] = "MODIFIED";
    GitFileState[GitFileState["DELETED"] = 2] = "DELETED";
    GitFileState[GitFileState["ADDED"] = 3] = "ADDED";
    GitFileState[GitFileState["UNTRACKED"] = 4] = "UNTRACKED";
})(GitFileState || (GitFileState = {}));
/**
 * Returns all the unstaged files
 */
export async function getUnstaged() {
    const root = getRootPath();
    return cmd(`git ls-files -m --full-name ${root}`, true);
}
export async function getBranches() {
    return cmd('git branch', true);
}
export async function getFilesDiff(commit1, commit2) {
    return cmd(`git diff --name-only ${commit1} ${commit2}`, true);
}
export function cwdInGitDir(wd = './') {
    return !!getRootPath(wd);
}
export function getRootPath(wd = './') {
    let { path } = parsePath(wd);
    const cachedRoot = GitCache.getInstance().getGitRoot(path);
    if (cachedRoot)
        return cachedRoot;
    while (path) {
        if (fs.existsSync(`${path}/.git`)) {
            GitCache.getInstance().addGitRoot(path);
            return path;
        }
        path = path.replace(/[^\/]*.$/, '');
    }
    return '';
}
/**
 * Gives the current path relative to the git root
 */
export function getRelativePath(wd = './') {
    const { path, file } = parsePath(wd);
    const root = this.getRootPath(wd);
    return (path + file).replace(root, '/');
}
//# sourceMappingURL=git.js.map