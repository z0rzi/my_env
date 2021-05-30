import fs from 'fs';
import { parsePath, toAbsolutePath } from './files.js';
import { cmd } from './shell.js';

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
}

export enum GitFileState {
    NONE = 0,
    MODIFIED = 1,
    DELETED = 2,
    ADDED = 3,
    UNTRACKED = 4,
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
    const root = this.getRootPath(wd);
    return (path + file).replace(root, '/');
}
