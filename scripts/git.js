var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs, { existsSync } from 'fs';
import path from 'path';
import ignore from 'ignore';
import { toAbsolutePath } from './files.js';
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
        this.isNotARepo = false;
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
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rawStatus = (yield cmd(`cd ${this.gitRoot}; git status --porcelain=1`, {
                    cutLines: true,
                    trim: false,
                }));
                rawStatus.forEach(line => this.handleRawLine(line));
            }
            catch (err) {
                // this is probably not a git repo
                this.isNotARepo = true;
            }
            if (this._readyResolve)
                this._readyResolve();
        });
    }
    getFileState(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isNotARepo)
                return GitFileState.NOT_GIT;
            filepath = getRelativePath(filepath);
            yield this.ready;
            if (this.added.includes(filepath))
                return GitFileState.ADDED;
            if (this.modified.includes(filepath))
                return GitFileState.MODIFIED;
            if (this.deleted.includes(filepath))
                return GitFileState.DELETED;
            if (this.ignored.includes(filepath))
                return GitFileState.IGNORED;
            return GitFileState.NONE;
        });
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
    GitFileState["MODIFIED"] = "~";
    GitFileState["DELETED"] = "-";
    GitFileState["ADDED"] = "+";
    GitFileState["IGNORED"] = "\u2237";
    GitFileState["NOT_GIT"] = "  ";
})(GitFileState || (GitFileState = {}));
/**
 * Returns all the unstaged files
 */
export function getUnstaged() {
    return __awaiter(this, void 0, void 0, function* () {
        const root = getRootPath();
        return cmd(`git ls-files -m --full-name ${root}`, {
            cutLines: true,
        });
    });
}
export function getFileState(path) {
    return __awaiter(this, void 0, void 0, function* () {
        let stats = GitCache.getInstance().getGitStatus(path);
        if (!stats) {
            stats = new GitStatus(path);
            GitCache.getInstance().addGitStatus(stats);
        }
        yield stats.ready;
        return stats.getFileState(path);
    });
}
export function getBranches() {
    return __awaiter(this, void 0, void 0, function* () {
        return cmd('git branch', { cutLines: true });
    });
}
export function getFilesDiff(commit1, commit2) {
    return __awaiter(this, void 0, void 0, function* () {
        return cmd(`git diff --name-only ${commit1} ${commit2}`, {
            cutLines: true,
        });
    });
}
export function cwdInGitDir(wd = './') {
    return !!getRootPath(wd);
}
export function getRootPath(wd = './') {
    wd = path.resolve(wd);
    while (true) {
        if (existsSync(path.join(wd, '.git')))
            return wd;
        wd = path.dirname(wd);
        if (wd === '/' || wd === '.')
            break;
    }
    return '';
}
/**
 * Gives the current path relative to the git root
 */
export function getRelativePath(wd = './') {
    const root = getRootPath(wd);
    return path.relative(root, toAbsolutePath(wd));
}
/**
 * Looks for an eventual `.gitignore` file at the specified path
 * @return An ignore rule per array item
 */
export function getGitIgnoreAt(dirPath) {
    const filePath = path.join(dirPath, '.gitignore');
    if (!fs.existsSync(filePath))
        return [];
    const content = fs.readFileSync(filePath).toString();
    return content.trim().split(/\s*\n\s*/g);
}
/**
 * Explores a directory recursively, searching for a file which name matches the
 * pattern. Avoids the gitignore'ed files
 *
 * @param dirPath The directory where the search starts
 * @param searchRx A regexp corresponding to the file name
 * @param callback To be called when a file is found
 * @param parentsIgnores for internal usage
 */
export function searchFile(dirPath, searchRx, callback, parentsIgnores = [], firstRecur = true) {
    const addIgnoreFrom = (dirPath, ignores) => {
        const gitIgnoreContent = getGitIgnoreAt(dirPath);
        if (gitIgnoreContent.length) {
            ignores.push({
                path: dirPath,
                ignorer: ignore().add([...gitIgnoreContent]),
            });
        }
        return ignores;
    };
    if (firstRecur) {
        // Making sure this is a directory
        if (!fs.statSync(dirPath).isDirectory()) {
            if (searchRx.test(path.parse(dirPath).base))
                callback(dirPath);
            return;
        }
        // check if there are .gitignore in parent directories
        const root = getRootPath(dirPath);
        let tmpPath = path.resolve(dirPath);
        while (true) {
            parentsIgnores = addIgnoreFrom(tmpPath, parentsIgnores);
            if (!path.relative(tmpPath, root))
                break;
            tmpPath = path.dirname(tmpPath);
            if (tmpPath === '.' || tmpPath === '/')
                break;
        }
    }
    parentsIgnores = addIgnoreFrom(dirPath, [...parentsIgnores]);
    if (!dirPath.startsWith('/'))
        dirPath = path.join(getRootPath(), dirPath);
    const kids = fs.readdirSync(dirPath, { withFileTypes: true }).map(kid => ({
        name: kid.name,
        isDir: kid.isDirectory(),
        isFile: kid.isFile(),
        path: path.join(dirPath, kid.name),
    }));
    for (const kid of kids) {
        let kidOk = true;
        for (const parentIgnore of parentsIgnores) {
            const relativePath = path.relative(parentIgnore.path, kid.path);
            if (parentIgnore.ignorer.ignores(relativePath)) {
                kidOk = false;
                break;
            }
        }
        if (!kidOk)
            continue;
        if (kid.isFile && searchRx.test(kid.name))
            callback(kid.path);
        if (kid.isDir)
            searchFile(kid.path, searchRx, callback, parentsIgnores, false);
    }
}
