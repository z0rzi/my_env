import { cmd } from "./shell.js";

/**
 * Returns all the unstaged files
 */
export async function getUnstaged(): Promise<string[]> {
    return getRootPath()
        .then(root => {
            return cmd(`git ls-files -m --full-name ${root}`, true) as Promise<string[]>;
        })
}

export async function getBranches(): Promise<string[]> {
    return cmd('git branch', true) as Promise<string[]>;
}

export async function getFilesDiff(commit1, commit2): Promise<string[]> {
    return cmd(`git diff --name-only ${commit1} ${commit2}`, true) as Promise<string[]>;
}

export async function cwdInGitDir(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        return getRelativePath()
            .then(() => resolve())
            .catch(() => reject(new Error('Not in a git dir!')));
    })
}

export async function getRootPath(): Promise<string> {
    return cwdInGitDir()
        .then(() => {
            return cmd('git rev-parse --show-toplevel') as Promise<string>;
        });
}

/**
 * Gives the current path relative to the git root
 */
export async function getRelativePath(): Promise<string> {
    return cmd('git rev-parse --show-prefix')
        .then(path => {
            return (path as string) || '/';
        });
}
