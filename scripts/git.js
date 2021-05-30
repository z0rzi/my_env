import fs from 'fs';
import { parsePath, toAbsolutePath } from './files.js';
import { cmd } from './shell.js';
class GitStatus {
    constructor(path) {
        /** Files ignored by git */
        this.ignored = [];
        /** New files */
        this.added = [];
        /** Modified files */
        this.modified = [];
        this.deleted = [];
        this._readyResolve = null;
        this.ready = new Promise(resolve => (this._readyResolve = resolve));
        this.gitRoot = getRootPath(path);
        this.refresh();
    }
    handleRawLine(line) {
        // TODO Handle file rename and copy
        if (/ -> /.test(line))
            return;
        const rawStatus = line.slice(0, 2);
        const rawPath = '/' + line.slice(2).trim();
        switch (rawStatus) {
            case '??':
                this.added.push(rawPath);
                return;
            case '!!':
                this.ignored.push(rawPath);
                return;
        }
        const addedStatus = rawStatus[0];
        const headStatus = rawStatus[1];
        // No difference between added or not, TODO?
        const stat = headStatus.trim() || addedStatus.trim();
        if (!stat)
            return;
        switch (stat) {
            case 'A':
                this.added.push(rawPath);
                return;
            case 'D':
                this.deleted.push(rawPath);
                return;
            case 'M':
                this.modified.push(rawPath);
                return;
        }
    }
    async refresh() {
        const rawStatus = (await cmd(`cd ${this.gitRoot}; git status --porcelain=1 --ignored`, true, false));
        rawStatus.forEach(line => this.handleRawLine(line));
        if (this._readyResolve)
            this._readyResolve();
    }
    async getFileState(filepath) {
        filepath = getRelativePath(filepath);
        await this.ready;
        if (this.added.includes(filepath))
            return GitFileState.ADDED;
        if (this.modified.includes(filepath))
            return GitFileState.MODIFIED;
        if (this.deleted.includes(filepath))
            return GitFileState.DELETED;
        if (this.ignored.includes(filepath))
            return GitFileState.IGNORED;
        return GitFileState.NONE;
    }
}
class GitCache {
    constructor() {
        this._gitRoots = [];
        this._gitStatus = {};
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
    addGitStatus(s) {
        if (!(s.gitRoot in this._gitStatus))
            this._gitStatus[s.gitRoot] = s;
    }
    getGitStatus(path) {
        path = getRootPath(path);
        for (const [root, stat] of Object.entries(this._gitStatus)) {
            if (path === root) {
                return stat;
            }
        }
        return null;
    }
}
export var GitFileState;
(function (GitFileState) {
    GitFileState["NONE"] = " ";
    GitFileState["MODIFIED"] = "*";
    GitFileState["DELETED"] = "-";
    GitFileState["ADDED"] = "+";
    GitFileState["IGNORED"] = "_";
})(GitFileState || (GitFileState = {}));
/**
 * Returns all the unstaged files
 */
export async function getUnstaged() {
    const root = getRootPath();
    return cmd(`git ls-files -m --full-name ${root}`, true);
}
export async function getFileState(path) {
    let stats = GitCache.getInstance().getGitStatus(path);
    if (!stats) {
        stats = new GitStatus(path);
        GitCache.getInstance().addGitStatus(stats);
    }
    await stats.ready;
    return stats.getFileState(path);
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
    const root = getRootPath(wd);
    return (path + file).replace(root, '/');
}
//# sourceMappingURL=git.js.map