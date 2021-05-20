import fs from 'fs';
import path from 'path';
import { CliColor, StyleOptions } from './cli.js';
import { getStyleFor, ICONS } from './icons.js';

export class File {
    children: File[] = [];
    parent: File = null;
    path = '';
    isDirectory = false;
    name = '';
    icon = '';
    iconColor: CliColor;
    textStyle: StyleOptions;

    gitFilters: RegExp[] = [];

    constructor(path: string) {
        path = path.replace(/\/+/g, '/').replace(/\/$/g, '');

        this.path = path;

        try {
            fs.existsSync(path);
        } catch (err) {
            throw new Error(`Could not find file '${path}'`);
        }

        this.isDirectory = fs.lstatSync(path).isDirectory();
        if (this.isDirectory) {
            this.path += '/';
            this.icon = '';
            this.iconColor = CliColor.GRAY;
            this.textStyle = { color: CliColor.GRAY };
        } else {
            const res = getStyleFor(path);

            this.icon = res.icon;
            this.iconColor = res.iconColor;
            this.textStyle = res.textStyle;
        }

        this.name = path.replace(/^.*\//, '');
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
            .filter(rule => !!rule && !/^\s*#/.test(rule))
            .map(
                rule =>
                    new RegExp(
                        rule
                            .replace(/\*\*/g, '.*')
                            .replace(/\*/g, '[^/]*')
                            .replace(/\?/g, '[^/]')
                            .replace(/\//g, '\\$&')
                    )
            );

        this.gitFilters = rules;
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

    appendChild(newChildName: string): void {
        const fileKid = this.fromPath(this.path + '/' + newChildName);
        fileKid.parent = this;
        this.children.push(fileKid);
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
    toString(): string {
        if (this.isDirectory) {
            this.explore();
            this.icon = ICONS.folder_open;
        }

        let out = `${this.icon} ${this.name}`;
        if (this.isDirectory && this.children.length) {
            out += '\n┆   ';
            out += this.children
                .map(kid => kid.toString().replace(/\n/g, '\n┆   '))
                .join('\n┆   ');
        }
        return out;
    }

    /**
     * Does git ignore this file?
     */
    isGitIgnored(): boolean {
        return this.gitFilters.some(rx => rx.test(this.path));
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
    remove(): void {
        if (this.isDirectory) {
            fs.rmdir(this.path, { recursive: true }, err => {
                if (err) {
                    console.error('Error while deleting file:\n', err);
                    process.exit(1);
                }

                this.parent.removeChild(this.name);
            });
        }
    }
}
