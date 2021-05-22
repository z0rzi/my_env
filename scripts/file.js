import fs from 'fs';
import path from 'path';
import { CliColor } from './cli.js';
import { getStyleFor, ICONS } from './icons.js';
export class File {
    constructor(path) {
        this.children = [];
        this.parent = null;
        this.path = '';
        this.isDirectory = false;
        this.name = '';
        this.icon = '';
        this.gitFilters = [];
        path = path.replace(/\/+/g, '/').replace(/\/$/g, '');
        this.path = path;
        try {
            fs.existsSync(path);
        }
        catch (err) {
            throw new Error(`Could not find file '${path}'`);
        }
        this.isDirectory = fs.lstatSync(path).isDirectory();
        this.refreshIcon();
        this.name = path.replace(/^.*\//, '');
    }
    refreshIcon() {
        if (this.isDirectory) {
            this.path += '/';
            this.icon = '';
            this.iconColor = CliColor.GRAY;
            this.textStyle = { color: CliColor.GRAY };
        }
        else {
            const res = getStyleFor(this.path);
            this.icon = res.icon;
            this.iconColor = res.iconColor;
            this.textStyle = res.textStyle;
        }
    }
    fromPath(path) {
        return new File(path);
    }
    /**
     * Finds the patterns to avoid in the gitignore file
     */
    parseGitIgnore() {
        const content = fs.readFileSync(this.path + '.gitignore').toString();
        const rules = content
            .split(/\n/g)
            .filter(rule => !!rule && !/^\s*#/.test(rule))
            .map(rule => new RegExp(rule
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '[^/]')
            .replace(/\//g, '\\$&')));
        this.gitFilters = rules;
    }
    /**
     * Finds the names of this directorie's children
     */
    findKidsNames() {
        let kidsNames = [];
        const kids = fs.readdirSync(this.path, {
            encoding: 'utf8',
            withFileTypes: true,
        });
        kidsNames = kids
            .filter(kid => {
            if (!kid.isFile() &&
                !kid.isDirectory() &&
                !kid.isSymbolicLink())
                return false;
            return true;
        })
            .map(kid => kid.name);
        if (kidsNames.includes('.gitignore'))
            this.parseGitIgnore();
        return kidsNames;
    }
    findParent() {
        const newPath = path.resolve(this.path + '/../');
        const papa = this.fromPath(newPath);
        papa.explore();
        const thisIdx = papa.children.findIndex(kiddo => kiddo.name === this.name);
        if (thisIdx >= 0) {
            papa.children[thisIdx] = this;
            this.parent = papa;
        }
        return papa;
    }
    appendChild(newChildName) {
        const fileKid = this.fromPath(this.path + '/' + newChildName);
        fileKid.parent = this;
        this.children.push(fileKid);
        return fileKid;
    }
    removeChild(dead_kid) {
        this.children = this.children.filter(kid => kid.name !== dead_kid);
    }
    /**
     * Finds this directory's children, and create new `File`'s instances
     */
    explore() {
        if (!this.isDirectory)
            return;
        if (this.children.length)
            return;
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
    toString() {
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
    isGitIgnored() {
        return this.gitFilters.some(rx => rx.test(this.path));
    }
    /**
     * Is it considered a hidden file (usually files beggining with a dot)
     */
    isHiddenFile() {
        return /^\./.test(this.name);
    }
    /**
     * Gives the depth of this file relative to the root node
     */
    get depth() {
        if (!this.parent)
            return 0;
        return this.parent.depth + 1;
    }
    /**
     * Gives the sibling before this file. `null` if it doesn't exist
     */
    get previousSibling() {
        if (!this.parent)
            return null;
        const idx = this.parent.children.indexOf(this);
        if (idx === 0)
            return null;
        return this.parent.children[idx - 1];
    }
    /**
     * Gives the sibling after this file. `null` if it doesn't exist
     */
    get nextSibling() {
        if (!this.parent)
            return null;
        const idx = this.parent.children.indexOf(this);
        if (this.parent.children.length > idx + 1)
            return this.parent.children[idx + 1];
        return null;
    }
    //
    // CRUD
    //
    remove() {
        try {
            if (this.isDirectory) {
                fs.rmdirSync(this.path, { recursive: true });
            }
            else {
                fs.rmSync(this.path);
            }
        }
        catch (err) {
            if (err) {
                console.error('Error while deleting file:\n', err);
                process.exit(1);
            }
        }
        this.parent.removeChild(this.name);
    }
    createChild(name, directory = false) {
        if (/\//g.test(name))
            return null;
        // not a directory
        if (!this.isDirectory)
            return this.parent.createChild(name);
        // kid already exists
        if (this.children.find(kid => kid.name === name))
            return null;
        if (directory)
            fs.mkdirSync(this.path + '/' + name);
        else
            fs.writeFileSync(this.path + '/' + name, '');
        return this.appendChild(name);
    }
    rename(newName) {
        if (/\//g.test(newName))
            return;
        fs.renameSync(this.path, `${this.parent.path}${newName}`);
        this.path = `${this.parent.path}${newName}`;
        this.name = newName;
        this.refreshIcon();
    }
}
//# sourceMappingURL=file.js.map