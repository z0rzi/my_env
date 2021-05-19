#!/bin/node
import fs from 'fs';
import './Array.js';
import { Cli, CliColor } from './cli.js';
import { getStyleFor, ICONS } from './icons.js';
import { editFile, NO_ARGS_PROVIDED } from './shell.js';
class File {
    constructor(path, maxDepth = -1, ignorePatterns = []) {
        this.children = [];
        this.parent = null;
        this.path = '';
        this.isDirectory = false;
        this.name = '';
        this.icon = '';
        this.opened = false;
        this.ignorePatterns = [/.git\//, /node_modules\//];
        path = path.replace(/\/+/g, '/').replace(/\/$/g, '');
        this.path = path;
        this.maxDepth = maxDepth;
        this.ignorePatterns.push(...ignorePatterns);
        try {
            fs.existsSync(path);
        }
        catch (err) {
            throw new Error(`Could not find file '${path}'`);
        }
        this.isDirectory = fs.lstatSync(path).isDirectory();
        if (this.isDirectory) {
            this.path += '/';
            this.icon = '';
            this.iconColor = CliColor.GRAY;
            this.textStyle = { color: CliColor.GRAY };
        }
        else {
            const res = getStyleFor(path);
            this.icon = res.icon;
            this.iconColor = res.iconColor;
            this.textStyle = res.textStyle;
        }
        this.name = path.replace(/^.*\//, '');
        if (this.opened)
            this.open();
    }
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
        this.ignorePatterns.push(...rules);
        this.ignorePatterns = this.ignorePatterns.uniq();
    }
    findKidsNames() {
        let kidsNames = [];
        const kids = fs.readdirSync(this.path, {
            encoding: 'utf8',
            withFileTypes: true,
        });
        kidsNames = kids
            .filter(kid => {
            if (!kid.isFile() && !kid.isDirectory())
                return false;
            for (const pattern of this.ignorePatterns) {
                if (pattern.test(this.path + kid.name)) {
                    return false;
                }
            }
            return true;
        })
            .map(kid => kid.name);
        if (kidsNames.includes('.gitignore'))
            this.parseGitIgnore();
        return kidsNames;
    }
    open() {
        if (!this.isDirectory)
            return;
        this.opened = !this.opened;
        if (this.children.length)
            return;
        const kidsNames = this.findKidsNames();
        if (this.maxDepth == 0)
            return;
        this.children = [];
        kidsNames.forEach(kid => {
            const fileKid = new File(this.path + '/' + kid, this.maxDepth - 1, this.ignorePatterns);
            fileKid.parent = this;
            this.children.push(fileKid);
        });
        this.children.alphasort(kid => kid.name);
        this.children.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory)
                return Number(b.isDirectory) - Number(a.isDirectory);
        });
    }
    /**
     * @return The visible File after this one has been closed
     */
    close() {
        if (this.isDirectory && this.opened) {
            this.opened = false;
            return this;
        }
        if (!!this.parent) {
            this.parent.close();
            return this.parent;
        }
        return this;
    }
    toString() {
        if (this.isDirectory)
            this.icon = this.opened ? ICONS.folder_open : ICONS.folder_closed;
        let out = `${this.icon} ${this.name}`;
        if (this.isDirectory && this.opened && this.children.length) {
            out += '\n┆   ';
            out += this.children
                .map(kid => kid.toString().replace(/\n/g, '\n┆   '))
                .join('\n┆   ');
        }
        return out;
    }
    draw(cli) {
        if (this.isDirectory)
            this.icon = this.opened ? ICONS.folder_open : ICONS.folder_closed;
        cli.goToLine(this.position);
        cli.clearLine();
        cli.write(`${'┆   '.repeat(this.indent)}`, { color: CliColor.BLACK });
        let iconStyle = this.textStyle;
        if (this.iconColor != null)
            iconStyle = { color: this.iconColor };
        cli.write(` ${this.icon} `, iconStyle);
        if (!this.isDirectory && /\./.test(this.name)) {
            const root = this.name.replace(/\.[^.]*$/, '');
            const extension = this.name.replace(/^.*\./, '');
            cli.write(`${root}.`, this.textStyle ?? {});
            cli.write(`${extension}`, iconStyle);
        }
        else {
            cli.write(`${this.name}`, this.textStyle ?? {});
        }
        if (this.isDirectory && this.opened) {
            for (const kid of this.children) {
                kid.draw(cli);
            }
        }
    }
    get indent() {
        if (!this.parent)
            return 0;
        return this.parent.indent + 1;
    }
    get position() {
        if (!this.parent)
            return 0;
        return this.parent.getChildAbsolutePos(this);
    }
    get height() {
        if (!this.isDirectory || !this.opened)
            return 1;
        let height = 1;
        for (const kid of this.children)
            height += kid.height;
        return height;
    }
    get previous() {
        if (!this.parent)
            return this;
        const f = this;
        const idx = f.parent.children.indexOf(f);
        if (idx === 0)
            return this.parent;
        let prev = f.parent.children[idx - 1];
        while (prev.isDirectory && prev.opened)
            prev = prev.children[prev.children.length - 1];
        return prev;
    }
    get next() {
        if (this.isDirectory && this.opened && this.children.length)
            return this.children[0];
        if (!this.parent)
            return this;
        let f = this;
        while (true) {
            const idx = f.parent.children.indexOf(f);
            if (f.parent.children.length > idx + 1)
                return f.parent.children[idx + 1];
            f = f.parent;
            if (!f.parent)
                break;
        }
        return this;
    }
    getChildAbsolutePos(child) {
        if (!this.isDirectory || !this.opened || !this.children.length)
            return -1;
        let pos = this.position + 1;
        for (const kid of this.children) {
            if (kid === child)
                return pos;
            pos += kid.height;
        }
        return -1;
    }
}
class Explorer {
    constructor(path, onFileOpen) {
        this.height = 30;
        this.isDead = false;
        this.cli = null;
        this.selectionPos = 0;
        this.showHidden = false;
        this.fileOpenListener = null;
        this.rootFile = new File(path);
        this.currentFile = this.rootFile;
        this.cli = Cli.getInstance(this.height);
        this.cli.onKeyHit(this.onInput.bind(this));
        this.fileOpenListener = onFileOpen;
        this.refreshDisplay();
    }
    end() {
        this.isDead = true;
    }
    refreshDisplay() {
        this.cli.clearScreen();
        this.rootFile.draw(this.cli);
    }
    onInput(keyName, ctrl, shift) {
        if (this.isDead)
            return;
        if (keyName === 'space')
            keyName = ' ';
        if (ctrl) {
            // nothing yet...
        }
        else if (keyName.length === 1) {
            if (shift)
                keyName = keyName.toUpperCase();
            switch (keyName) {
                case 'q':
                    process.exit(0);
            }
        }
        else {
            switch (keyName) {
                case 'backspace':
                    break;
                case 'delete':
                    break;
                case 'f1':
                    break;
                case 'f5':
                    break;
                case 'left':
                    this.currentFile = this.currentFile.close();
                    this.refreshDisplay();
                    break;
                case 'right':
                    if (!this.currentFile.isDirectory)
                        this.fileOpenListener(this.currentFile);
                    else {
                        this.currentFile.open();
                        this.refreshDisplay();
                    }
                    break;
                case 'up':
                    this.currentFile = this.currentFile.previous;
                    break;
                case 'down':
                    this.currentFile = this.currentFile.next;
                    break;
                case 'return':
                    break;
                case 'escape':
                    break;
            }
        }
        this.cli.goToLine(this.currentFile.position);
    }
}
async function explore(path) {
    return new Promise((resolve, reject) => {
        new Explorer(path, file => {
            resolve(file);
        });
    });
}
export { Explorer, explore };
if (/explorer\.js$/.test(process.argv[1])) {
    if (NO_ARGS_PROVIDED)
        process.exit(1);
    const path = process.argv[2];
    const cli = Cli.getInstance();
    const exp = new Explorer(path, file => {
        cli.offHitKey();
        editFile(file.path).then(() => {
            cli.onKeyHit(exp.onInput.bind(exp));
        });
    });
}
//# sourceMappingURL=explorer.js.map