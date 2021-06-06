#!/bin/node
import path from 'path';
import './Array.js';
import { Cli, CliColor } from './cli.js';
import { File } from './file.js';
import { fuzzyFind } from './fuzzyFinder.js';
import { GitFileState } from './git.js';
import { ICONS } from './icons.js';
import { Prompt } from './prompt.js';
import { NO_ARGS_PROVIDED, openFile } from './shell.js';
const INDENT = '┆   ';
class ExplorerFile extends File {
    constructor(path) {
        super(path);
        this.children = [];
        this.parent = null;
        this.opened = false;
        this._showHidden = false;
        this._gitOnly = false;
        if (this.opened)
            this.open();
    }
    get showHidden() {
        if (!this.parent)
            return this._showHidden;
        return this.parent.showHidden;
    }
    set showHidden(show) {
        if (!this.parent)
            this._showHidden = show;
        else
            this.parent.showHidden = show;
    }
    get gitOnly() {
        if (!this.parent)
            return this._gitOnly;
        return this.parent.gitOnly;
    }
    set gitOnly(show) {
        if (!this.parent)
            this._gitOnly = show;
        else
            this.parent.gitOnly = show;
    }
    toggleHidden() {
        this.showHidden = !this.showHidden;
    }
    async open(recursive = 0, openStartTime = 0) {
        const timeStamp = new Date().valueOf();
        if (openStartTime && timeStamp - openStartTime > 500)
            return;
        this.opened = !!recursive || !this.opened;
        if (!this.children.length)
            this.explore();
        if (recursive > 0) {
            this.children.forEach(kid => {
                if (!kid.isGitIgnored())
                    kid.open(recursive - 1, openStartTime || timeStamp);
            });
        }
    }
    async openToPath(path) {
        if (!this.isDirectory ||
            path === this.path ||
            !path.startsWith(this.path))
            return this;
        if (!this.opened)
            await this.open();
        for (const kid of this.children)
            if (path.startsWith(kid.path))
                return kid.openToPath(path);
        return this;
    }
    async isVisible() {
        if (!this.showHidden && this.isHiddenFile())
            return false;
        if (this.gitOnly) {
            const gitState = await this.getGitState();
            if (gitState === GitFileState.NONE ||
                gitState === GitFileState.IGNORED)
                return false;
        }
        return true;
    }
    async getClosestVisible() {
        if (await this.isVisible())
            return this;
        let f = this;
        while (!(await f.isVisible())) {
            f =
                f.previousSibling ??
                    f.parent;
        }
        return f;
    }
    async getVisibleChildren() {
        return await this.children.asyncFilter(async (kid) => await kid.isVisible());
    }
    fromPath(path) {
        return new ExplorerFile(path);
    }
    /**
     * @return The visible file after this one has been closed
     */
    close(recursive = false) {
        if (this.isDirectory && this.opened) {
            this.opened = false;
            if (recursive)
                this.children.forEach(kid => {
                    if (kid.isDirectory && kid.opened)
                        kid.close(true);
                });
            return this;
        }
        if (!!this.parent) {
            this.parent.close();
            return this.parent;
        }
        return this;
    }
    refreshChildren() {
        if (!this.isDirectory || !this.opened) {
            this.parent.refreshChildren();
            return (this.parent.children.find(kid => kid.name === this.name) ||
                this.parent);
        }
        if (this.opened)
            this.close();
        this.children = [];
        this.open();
        return this;
    }
    async draw(cli, offset = 0, options) {
        options = Object.assign({
            drawKids: true,
            emphasis: false,
        }, options);
        if (!this.showHidden && this.isHiddenFile())
            return;
        const gitStateIcon = await this.getGitState();
        const truePosition = (await this.getPosition()) - offset;
        if (truePosition > cli.maxHeight)
            return;
        if (this.isDirectory)
            this.icon = this.opened ? ICONS.folder_open : ICONS.folder_closed;
        if (truePosition >= 0) {
            cli.goToLine(truePosition);
            cli.clearLine();
            cli.write(`${INDENT.repeat(this.depth)}`, {
                color: CliColor.BLACK,
            });
            let iconStyle = this.textStyle;
            if (this.iconColor != null)
                iconStyle = { color: this.iconColor };
            cli.write(`${this.icon} `, iconStyle);
            const textStyle = { ...this.textStyle };
            if (options.emphasis)
                textStyle.underline = true;
            if (!this.isDirectory && /\./.test(this.name)) {
                const root = this.name.replace(/\.[^.]*$/, '');
                const extension = this.name.replace(/^.*\./, '');
                cli.write(`${root}.`, textStyle ?? {});
                cli.write(`${extension}`, iconStyle);
            }
            else {
                cli.write(`${this.name}`, textStyle ?? {});
            }
            cli.write(` ${gitStateIcon}`, { italic: true });
        }
        if (this.isDirectory && this.opened && options.drawKids) {
            for (const kid of await this.getVisibleChildren()) {
                await kid.draw(cli, offset, options);
            }
        }
    }
    async getPosition() {
        if (!this.parent)
            return 0;
        return await this.parent.getChildAbsolutePos(this);
    }
    async getHeight() {
        if (!(await this.isVisible()))
            return 0;
        if (!this.isDirectory || !this.opened)
            return 1;
        let height = 1;
        for (const kid of await this.getVisibleChildren())
            height += await kid.getHeight();
        return height;
    }
    get width() {
        return this.depth * INDENT.length + this.name.length + 2;
    }
    async getPrevious() {
        if (!this.parent)
            return this;
        const siblings = await this.parent.getVisibleChildren();
        const idx = siblings.indexOf(this);
        if (idx === 0)
            return this.parent;
        let prev = siblings[idx - 1];
        let prevKids = await prev.getVisibleChildren();
        while (prev.isDirectory && prevKids.length && prev.opened) {
            prev = prevKids[prevKids.length - 1];
            prevKids = await prev.getVisibleChildren();
        }
        return prev;
    }
    async getNext() {
        if (this.isDirectory && this.opened) {
            const kids = await this.getVisibleChildren();
            if (kids.length)
                return kids[0];
        }
        if (!this.parent)
            return this;
        let f = this;
        while (true) {
            const kids = await f.parent.getVisibleChildren();
            const idx = kids.indexOf(f);
            if (kids.length > idx + 1)
                return kids[idx + 1];
            f = f.parent;
            if (!f.parent)
                break;
        }
        return this;
    }
    async getChildAbsolutePos(child) {
        if (!this.isDirectory || !this.opened || !this.children.length)
            return -1;
        let pos = (await this.getPosition()) + 1;
        for (const kid of await this.getVisibleChildren()) {
            if (kid === child)
                return pos;
            pos += await kid.getHeight();
        }
        return -1;
    }
}
class Explorer {
    constructor(path, onFileOpen) {
        this.height = -1;
        this.cli = null;
        this.selectionPos = 0;
        this.lastOffset = 0;
        this.offset = 0;
        this.gitOnlyMode = false;
        this.showHidden = false;
        this.fileOpenListener = null;
        this.rootFile = new ExplorerFile(path);
        this.rootFile.open();
        this.currentFile = this.rootFile;
        this.fileOpenListener = onFileOpen;
        this.cli = new Cli(this.height);
        this.cli.onKeyHit(this.onInput.bind(this));
        this.cli.toggleCursor(false);
        this.cli.waitForReady.then(() => {
            this.height = this.cli.maxHeight;
            this.refreshDisplay();
        });
    }
    get currentFile() {
        return this._currentFile;
    }
    set currentFile(newFile) {
        this.previousFile = this._currentFile;
        this._currentFile = newFile;
    }
    async correctOffset() {
        const curfilepos = await this.currentFile.getPosition();
        if (curfilepos - this.offset < 0) {
            // current file above screen
            this.offset = curfilepos;
        }
        if (curfilepos - this.offset >= this.cli.maxHeight) {
            // current file below screen
            this.offset = curfilepos - this.cli.maxHeight;
        }
    }
    async refreshScreen() {
        await this.correctOffset();
        await this.rootFile.draw(this.cli, this.offset);
        this.cli.goToLine((await this.currentFile.getPosition()) - this.offset);
        await this.refreshEmphasis();
        await this.clearAfterLast();
    }
    async refreshDisplay() {
        await this.correctOffset();
        if (this.offset !== this.lastOffset) {
            this.lastOffset = this.offset;
            return await this.refreshScreen();
        }
        let file = this.currentFile;
        while (file) {
            await file.draw(this.cli, this.offset);
            let nextFile = file.nextSibling;
            while (!!file && !nextFile) {
                nextFile = file.nextSibling;
                file = file.parent;
            }
            file = nextFile;
        }
        await this.clearAfterLast();
        await this.refreshEmphasis();
        this.cli.goToLine((await this.currentFile.getPosition()) - this.offset);
    }
    async clearAfterLast() {
        this.cli.goToLine((await this.rootFile.getHeight()) - this.offset - 1);
        while (this.cli.y < this.cli.maxHeight) {
            this.cli.down();
            this.cli.clearLine();
        }
    }
    async refreshEmphasis() {
        if (this.previousFile)
            await this.previousFile.draw(this.cli, this.offset, {
                drawKids: false,
                emphasis: false,
            });
        if (this.currentFile)
            await this.currentFile.draw(this.cli, this.offset, {
                drawKids: false,
                emphasis: true,
            });
    }
    async createPrompt(initValue = '', col = this.currentFile.width - this.currentFile.name.length, line = this.cli.y) {
        return new Promise((resolve, reject) => {
            const p = new Prompt(this.cli, line, col);
            p.value = initValue;
            p.caretPos = initValue.length;
            p.onConfirm = (text) => {
                this.cli.toggleCursor(false);
                resolve(text);
                return true;
            };
            p.onCancel = async () => {
                this.cli.toggleCursor(false);
                await this.refreshEmphasis();
                reject();
                return true;
            };
        });
    }
    //
    // Actions
    //
    async open(recursive = false) {
        if (!this.currentFile.isDirectory)
            this.fileOpenListener(this.currentFile);
        else {
            await this.currentFile.open(recursive ? 5 : 0);
            await this.refreshDisplay();
        }
    }
    async close(recursive = false) {
        this.currentFile = this.currentFile.close(recursive);
        this.refreshDisplay();
    }
    async createNew(isDir = false) {
        let newfile = null;
        if (this.currentFile.isDirectory && this.currentFile.opened) {
            newfile = this.currentFile.createChild('_explorer_internal', isDir);
        }
        else
            newfile = this.currentFile.parent.createChild('_explorer_internal', isDir);
        if (!newfile)
            return;
        this.currentFile = newfile;
        this.refreshDisplay();
        try {
            const text = await this.createPrompt();
            this.currentFile.rename(text);
            await this.refreshDisplay();
        }
        catch (err) {
            // prompt cancel
            const file = this.currentFile;
            this.currentFile = await this.currentFile.getClosestVisible();
            if (this.currentFile === file)
                this.currentFile = await this.currentFile.getPrevious();
            file.remove().then(this.refreshDisplay.bind(this));
        }
    }
    async changeRoot() {
        // Change root dir
        if (this.currentFile.isDirectory) {
            this.rootFile = this.currentFile;
            this.rootFile.parent = null;
            await this.refreshDisplay();
        }
    }
    async rename() {
        try {
            const text = await this.createPrompt(this.currentFile.name);
            this.currentFile.rename(text);
            this.refreshDisplay();
        }
        catch (err) {
            // prompt cancel
        }
    }
    async goUp(toFirst) {
        if (toFirst) {
            this.currentFile = (await this.currentFile.parent.getVisibleChildren())[0];
        }
        else {
            this.currentFile = await this.currentFile.getPrevious();
        }
        if (this.offset > 0 &&
            (await this.currentFile.getPosition()) - this.offset <= 0) {
            this.refreshDisplay();
        }
        else {
            await this.refreshEmphasis();
        }
    }
    async goDown(toLast) {
        if (toLast) {
            const siblings = await this.currentFile.parent.getVisibleChildren();
            this.currentFile = siblings[siblings.length - 1];
        }
        else
            this.currentFile = await this.currentFile.getNext();
        if ((await this.currentFile.getPosition()) - this.offset >
            this.cli.maxHeight) {
            this.refreshDisplay();
        }
        else {
            this.refreshEmphasis();
        }
    }
    async remove() {
        this.cli.goToCol(this.currentFile.width + 1);
        this.cli.write('Sure? ');
        try {
            const text = await this.createPrompt('', this.currentFile.width + 1 + 'Sure? '.length);
            if (text === 'yes') {
                const file = this.currentFile;
                this.currentFile = await this.currentFile.getNext();
                if (this.currentFile === file)
                    this.currentFile = await this.currentFile.getPrevious();
                file.remove().then(this.refreshDisplay.bind(this));
            }
            await this.refreshDisplay();
        }
        catch (err) {
            // prompt cancel
        }
    }
    async fuzzySearch() {
        const allKids = await this.currentFile.getAllChildren();
        this.cli.toggleCursor(true);
        let choice;
        try {
            choice = await fuzzyFind(allKids, undefined, this.cli);
        }
        catch (err) {
            this.cli.toggleCursor(false);
            return;
        }
        const path = this.currentFile.path + choice.label.replace(/^\.\//, '');
        this.currentFile = await this.currentFile.openToPath(path);
        this.cli.toggleCursor(false);
        return;
    }
    async onInput(keyName, ctrl, shift) {
        if (keyName === 'space')
            keyName = ' ';
        if (keyName.length === 1) {
            switch (keyName) {
                case 'q':
                    this.cli.clearScreen();
                    this.cli.toggleCursor(true);
                    process.exit(0);
                case 'r':
                    if (shift)
                        this.changeRoot();
                    else
                        this.rename();
                    break;
                case 'x':
                    this.close(ctrl || shift);
                    break;
                case 'g':
                    this.gitOnlyMode = !this.gitOnlyMode;
                    this.rootFile.gitOnly = this.gitOnlyMode;
                    this.currentFile =
                        await this.currentFile.getClosestVisible();
                    await this.refreshScreen();
                    break;
                case 's':
                    await this.fuzzySearch();
                    await this.refreshScreen();
                    break;
                case 'z':
                    this.offset =
                        (await this.currentFile.getPosition()) -
                            ((this.cli.maxHeight / 2) >> 0);
                    if (this.offset < 0)
                        this.offset = 0;
                    this.refreshDisplay();
                    break;
                case 'a':
                    this.createNew(shift);
                    break;
                case '.':
                    this.rootFile.toggleHidden();
                    this.currentFile =
                        await this.currentFile.getClosestVisible();
                    await this.refreshScreen();
            }
        }
        else {
            switch (keyName) {
                case 'f5':
                    this.currentFile = this.currentFile.refreshChildren();
                    await this.refreshScreen();
                    break;
                case 'left':
                    await this.close(ctrl || shift);
                    break;
                case 'right':
                    await this.open(ctrl || shift);
                    break;
                case 'return':
                    await this.open(ctrl || shift);
                    break;
                case 'up':
                    await this.goUp(shift || ctrl);
                    break;
                case 'down':
                    await this.goDown(ctrl || shift);
                    break;
                case 'delete':
                    await this.remove();
                    break;
                case 'backspace':
                    if (this.currentFile.parent) {
                        this.currentFile = this.currentFile.parent;
                        this.currentFile.close();
                    }
                    else {
                        this.rootFile =
                            this.rootFile.findParent();
                        this.currentFile = this.rootFile;
                        this.rootFile.open();
                    }
                    this.refreshDisplay();
                    break;
            }
        }
        this.cli.goToLine((await this.currentFile.getPosition()) - this.offset);
    }
}
async function explore(path) {
    return new Promise(resolve => {
        new Explorer(path, file => {
            resolve(file);
        });
    });
}
export { Explorer, ExplorerFile, explore };
if (/explorer\.js$/.test(process.argv[1])) {
    let inPath = '';
    if (NO_ARGS_PROVIDED)
        inPath = './';
    else
        inPath = process.argv[2];
    const cli = new Cli();
    const exp = new Explorer(path.resolve(inPath), file => {
        cli.offHitKey();
        const editorSave = process.env['EDITOR'];
        if (exp.gitOnlyMode)
            process.env['EDITOR'] = 'codediff';
        openFile(file.path).then(() => {
            process.env['EDITOR'] = editorSave;
            cli.onKeyHit(exp.onInput.bind(exp));
            cli.toggleCursor(false);
        });
    });
}
//# sourceMappingURL=explorer.js.map