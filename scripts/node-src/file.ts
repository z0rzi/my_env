#!/bin/node

import fs from 'fs';
import path from 'path';
import './Array.js';
import { CliColor, StyleOptions } from './cli.js';
import * as git from './git.js';
import { GitFileState } from './git.js';
import { getStyleFor, ICONS } from './icons.js';
import { cmd, NO_ARGS_PROVIDED } from './shell.js';

export class File {
    children: File[] = [];
    parent: File = null;
    path = '';
    isDirectory = false;
    name = '';
    icon = '';
    iconColor: CliColor;
    textStyle: StyleOptions;

    _gitFilters: RegExp[] = [/\/\.git\//];

    get gitFilters(): RegExp[] {
        return [
            ...(this.parent ? this.parent.gitFilters : []),
            ...this._gitFilters,
        ];
    }

    set gitFilters(filters: RegExp[]) {
        this._gitFilters = filters;
    }

    addGitFilters(...newFilters: RegExp[]): void {
        if (Array.isArray(this._gitFilters)) this._gitFilters = [];
        this._gitFilters.push(...newFilters);
    }

    get extension(): string {
        const ext = this.name.match(/(?<=\.)[^.]+$/g);
        if (!ext) return '';
        return ext[0];
    }

    constructor(path: string) {
        path = path.replace(/\/+/g, '/').replace(/\/$/g, '');

        this.path = path;

        try {
            fs.existsSync(path);
        } catch (err) {
            throw new Error(`Could not find file '${path}'`);
        }

        this.isDirectory = fs.lstatSync(path).isDirectory();

        this.refreshIcon();

        this.name = path.replace(/^.*\//, '');
    }

    refreshIcon(): void {
        if (this.isDirectory) {
            this.path += '/';
            this.icon = '';
            this.iconColor = CliColor.GRAY;
            this.textStyle = { color: CliColor.GRAY };
        } else {
            const res = getStyleFor(this.path);

            this.icon = res.icon;
            this.iconColor = res.iconColor;
            this.textStyle = res.textStyle;
        }
    }

    fromPath(path: string): File {
        return new File(path);
    }

    /**
     * Finds the patterns to avoid in the gitignore file
     */
    private parseGitIgnore() {
        const content = fs.readFileSync(this.path + '.gitignore').toString();

        const rules = content
            .split(/\n/g)
            .filter(rule => !!rule.trim() && !/^\s*#/.test(rule))
            .map(
                rule =>
                    new RegExp(
                        rule
                            .replace(/\r/g, '')
                            .replace(/\*\*/g, '.*')
                            .replace(/\*/g, '[^/]*')
                            .replace(/\?/g, '[^/]')
                            .replace(/\//g, '\\$&')
                    )
            );

        this.addGitFilters(...rules);
    }

    /**
     * Finds the names of this directorie's children
     */
    private findKidsNames(): string[] {
        let kidsNames: string[] = [];

        const kids = fs.readdirSync(this.path, {
            encoding: 'utf8',
            withFileTypes: true,
        });

        kidsNames = kids
            .filter(kid => {
                if (
                    !kid.isFile() &&
                    !kid.isDirectory() &&
                    !kid.isSymbolicLink()
                )
                    return false;
                return true;
            })
            .map(kid => kid.name);

        if (kidsNames.includes('.gitignore')) this.parseGitIgnore();

        return kidsNames;
    }

    get gitState(): GitFileState {
        return GitFileState.NONE;
    }

    findParent(): File {
        const newPath = path.resolve(this.path + '/../');
        const papa = this.fromPath(newPath);
        papa.explore();
        const thisIdx = papa.children.findIndex(
            kiddo => kiddo.name === this.name
        );
        if (thisIdx >= 0) {
            papa.children[thisIdx] = this;
            this.parent = papa;
        }
        return papa;
    }

    appendChild(newChildName: string): File {
        const fileKid = this.fromPath(this.path + '/' + newChildName);
        fileKid.parent = this;
        this.children.push(fileKid);
        return fileKid;
    }

    removeChild(dead_kid: string): void {
        this.children = this.children.filter(kid => kid.name !== dead_kid);
    }

    /**
     * Finds this directory's children, and create new `File`'s instances
     */
    explore(): void {
        if (!this.isDirectory) return;

        if (this.children.length) return;

        const kidsNames = this.findKidsNames();
        this.children = [];
        kidsNames.forEach(kid => {
            this.appendChild(kid);
        });

        this.children.alphasort(kid => kid.name);
        this.children.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory)
                return Number(b.isDirectory) - Number(a.isDirectory);
        });
    }

    /**
     * Displays this file and all of its children
     */
    async toString(): Promise<string> {
        if (this.isGitIgnored()) return '';

        const fileGitStatus = await git.getFileState(this.path);

        if (this.isDirectory) {
            this.explore();
            this.icon = ICONS.folder_open;
        }

        let out = `${this.icon} ${fileGitStatus} ${this.name}`;
        if (this.isDirectory && this.children.length) {
            out += '\n┆   ';
            out += (
                await this.children.asyncMap<string>(async kid => {
                    if (!kid.isGitIgnored())
                        return (await kid.toString()).replace(/\n/g, '\n┆   ');
                    return '';
                })
            )
                .filter(strKid => !!strKid)
                .join('\n┆   ');
        }
        return out;
    }

    /**
     * Does git ignore this file?
     */
    isGitIgnored(): boolean {
        const relative = git.getRelativePath(this.path);
        return this.gitFilters.some(rx => rx.test(relative));
    }

    /**
     * Is it considered a hidden file (usually files beggining with a dot)
     */
    isHiddenFile(): boolean {
        return /^\./.test(this.name);
    }

    /**
     * Gives the depth of this file relative to the root node
     */
    get depth(): number {
        if (!this.parent) return 0;
        return this.parent.depth + 1;
    }

    /**
     * Gives the sibling before this file. `null` if it doesn't exist
     */
    get previousSibling(): File {
        if (!this.parent) return null;

        const idx = this.parent.children.indexOf(this);
        if (idx === 0) return null;

        return this.parent.children[idx - 1];
    }

    /**
     * Gives the sibling after this file. `null` if it doesn't exist
     */
    get nextSibling(): File {
        if (!this.parent) return null;

        const idx = this.parent.children.indexOf(this);
        if (this.parent.children.length > idx + 1)
            return this.parent.children[idx + 1];

        return null;
    }

    //
    // CRUD
    //
    async remove(): Promise<void> {
        try {
            if (this.isDirectory) {
                fs.rmdirSync(this.path, { recursive: true });
            } else {
                fs.rmSync(this.path);
            }
        } catch (err) {
            if (err) {
                try {
                    await cmd('gksu rm -rf "' + this.path + '"');
                } catch (err) {
                    console.error('Error while deleting file:\n', err);
                    process.exit(1);
                }
            }
        }
        this.parent.removeChild(this.name);
    }

    createChild(name: string, directory = false): File {
        if (/\//g.test(name)) return null;

        // not a directory
        if (!this.isDirectory) return this.parent.createChild(name);

        // kid already exists
        if (this.children.find(kid => kid.name === name)) return null;

        if (directory) fs.mkdirSync(this.path + '/' + name);
        else fs.writeFileSync(this.path + '/' + name, '');

        return this.appendChild(name);
    }

    rename(newName: string): void {
        if (/\//g.test(newName)) return;
        fs.renameSync(this.path, `${this.parent.path}${newName}`);
        this.path = `${this.parent.path}${newName}`;
        this.name = newName;
        this.refreshIcon();
    }
}

if (/file\.js$/.test(process.argv[1])) {
    let inPath = '';

    if (NO_ARGS_PROVIDED) inPath = './';
    else inPath = process.argv[2];

    inPath = path.resolve(inPath);

    (async () => {
        console.log(await new File(inPath).toString());
    })();
}
