import fs from 'fs';
import { parsePath, toAbsolutePath } from './files.js';
import { cmd } from './shell.js';

class GitStatus {
    gitRoot: string;

    /** Files ignored by git */
    ignored: string[] = [];

    /** New files */
    added: string[] = [];

    /** Modified files */
    modified: string[] = [];
    deleted: string[] = [];

    constructor(path: string) {
        this.gitRoot = getRootPath(path);
        this.refresh();
    }

    private handleRawLine(line: string): void {
        // TODO Handle file rename and copy
        if (/ -> /.test(line)) return;

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

        if (!stat) return;

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

    private _readyResolve = null;
    ready = new Promise(resolve => (this._readyResolve = resolve));
    async refresh(): Promise<void> {
        const rawStatus = (await cmd(
            `cd ${this.gitRoot}; git status --porcelain=1 --ignored`,
            true,
            false
        )) as string[];
        rawStatus.forEach(line => this.handleRawLine(line));
        if (this._readyResolve) this._readyResolve();
    }

    async getFileState(filepath: string): Promise<GitFileState> {
        filepath = getRelativePath(filepath);

        await this.ready;

        if (this.added.includes(filepath)) return GitFileState.ADDED;
        if (this.modified.includes(filepath)) return GitFileState.MODIFIED;
        if (this.deleted.includes(filepath)) return GitFileState.DELETED;
        if (this.ignored.includes(filepath)) return GitFileState.IGNORED;

        return GitFileState.NONE;
    }
}

class GitCache {
    static _instance: GitCache;
    static getInstance(): GitCache {
        if (!GitCache._instance) GitCache._instance = new GitCache();
        return GitCache._instance;
    }

    _gitRoots = [] as string[];
    addGitRoot(path: string) {
        path = toAbsolutePath(path);
        if (this._gitRoots.includes(path)) this._gitRoots.push(path);
    }
    getGitRoot(path: string): string {
        path = toAbsolutePath(path);
        for (const root of this._gitRoots) {
            if (path.startsWith(root)) {
                return root;
            }
        }
        return '';
    }

    _gitStatus = {} as { [rootPath: string]: GitStatus };
    addGitStatus(s: GitStatus): void {
        if (!(s.gitRoot in this._gitStatus)) this._gitStatus[s.gitRoot] = s;
    }
    getGitStatus(path: string): GitStatus | null {
        path = getRootPath(path);
        for (const [root, stat] of Object.entries(this._gitStatus)) {
            if (path === root) {
                return stat;
            }
        }
        return null;
    }
}

export enum GitFileState {
    NONE = ' ',
    MODIFIED = '*',
    DELETED = '-',
    ADDED = '+',
    IGNORED = '_',
}

/**
 * Returns all the unstaged files
 */
export async function getUnstaged(): Promise<string[]> {
    const root = getRootPath();
    return cmd(`git ls-files -m --full-name ${root}`, true) as Promise<
        string[]
    >;
}

export async function getFileState(path: string): Promise<GitFileState> {
    let stats = GitCache.getInstance().getGitStatus(path);

    if (!stats) {
        stats = new GitStatus(path);
        GitCache.getInstance().addGitStatus(stats);
    }
    await stats.ready;
    return stats.getFileState(path);
}

export async function getBranches(): Promise<string[]> {
    return cmd('git branch', true) as Promise<string[]>;
}

export async function getFilesDiff(
    commit1: string,
    commit2: string
): Promise<string[]> {
    return cmd(`git diff --name-only ${commit1} ${commit2}`, true) as Promise<
        string[]
    >;
}

export function cwdInGitDir(wd = './'): boolean {
    return !!getRootPath(wd);
}

export function getRootPath(wd = './'): string {
    let { path } = parsePath(wd);

    const cachedRoot = GitCache.getInstance().getGitRoot(path);
    if (cachedRoot) return cachedRoot;

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
export function getRelativePath(wd = './'): string {
    const { path, file } = parsePath(wd);
    const root = getRootPath(wd);
    return (path + file).replace(root, '/');
}
