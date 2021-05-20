#!/bin/node
import path from 'path';
import './Array.js';
import { Cli, CliColor } from './cli.js';
import { File } from './file.js';
import { ICONS } from './icons.js';
import { openFile, NO_ARGS_PROVIDED } from './shell.js';
class ExplorerFile extends File {
    constructor(path) {
        super(path);
        this.children = [];
        this.parent = null;
        this.opened = false;
        this._showHidden = false;
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
    toggleHidden() {
        this.showHidden = !this.showHidden;
    }
    async open(recursive = 0, openStartTime = 0) {
        const timeStamp = new Date().valueOf();
        if (openStartTime && timeStamp - openStartTime > 500)
            return;
        this.opened = !this.opened;
        if (!this.children.length)
            this.explore();
        if (recursive > 0) {
            this.children.forEach(kid => {
                if (!kid.isGitIgnored())
                    kid.open(recursive - 1, openStartTime || timeStamp);
            });
        }
    }
    get visibleChildren() {
        if (this.showHidden)
            return this.children;
        return this.children.filter(kid => !kid.isHiddenFile());
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
    draw(cli, offset = 0, drawKids = true, emphasis = false) {
        if (!this.showHidden && this.isHiddenFile())
            return;
        const truePosition = this.position - offset;
        if (truePosition > cli.maxHeight)
            return;
        if (this.isDirectory)
            this.icon = this.opened ? ICONS.folder_open : ICONS.folder_closed;
        if (truePosition >= 0) {
            cli.goToLine(truePosition);
            cli.clearLine();
            cli.write(`${'┆   '.repeat(this.depth)}`, {
                color: CliColor.BLACK,
            });
            let iconStyle = this.textStyle;
            if (this.iconColor != null)
                iconStyle = { color: this.iconColor };
            cli.write(`${this.icon} `, iconStyle);
            const textStyle = { ...this.textStyle };
            if (emphasis)
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
        }
        if (this.isDirectory && this.opened && drawKids) {
            for (const kid of this.visibleChildren) {
                kid.draw(cli, offset);
            }
        }
    }
    get position() {
        if (!this.parent)
            return 0;
        return this.parent.getChildAbsolutePos(this);
    }
    get height() {
        if (!this.showHidden && this.isHiddenFile())
            return 0;
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
        const idx = f.parent.visibleChildren.indexOf(f);
        if (idx === 0)
            return this.parent;
        let prev = f.parent.visibleChildren[idx - 1];
        while (prev.isDirectory && prev.visibleChildren.length && prev.opened)
            prev = prev.visibleChildren[prev.visibleChildren.length - 1];
        return prev;
    }
    get next() {
        if (this.isDirectory && this.opened && this.visibleChildren.length)
            return this.visibleChildren[0];
        if (!this.parent)
            return this;
        let f = this;
        while (true) {
            const idx = f.parent.visibleChildren.indexOf(f);
            if (f.parent.visibleChildren.length > idx + 1)
                return f.parent.visibleChildren[idx + 1];
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
        for (const kid of this.visibleChildren) {
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
        this.lastOffset = 0;
        this.offset = 0;
        this.showHidden = false;
        this.fileOpenListener = null;
        this.rootFile = new ExplorerFile(path);
        this.currentFile = this.rootFile;
        this.cli = Cli.getInstance(this.height);
        this.cli.onKeyHit(this.onInput.bind(this));
        this.cli.toggleCursor(false);
        this.fileOpenListener = onFileOpen;
        this.refreshDisplay();
    }
    get currentFile() {
        return this._currentFile;
    }
    set currentFile(newFile) {
        this.previousFile = this._currentFile;
        this._currentFile = newFile;
    }
    end() {
        this.isDead = true;
    }
    correctOffset() {
        if (this.currentFile.position - this.offset < 0) {
            // current file above screen
            this.offset = this.currentFile.position;
        }
        if (this.currentFile.position - this.offset > this.cli.maxHeight) {
            // current file below screen
            this.offset = this.currentFile.position - this.cli.maxHeight;
        }
    }
    refreshScreen() {
        this.correctOffset();
        this.rootFile.draw(this.cli, this.offset);
        this.cli.goToLine(this.currentFile.position - this.offset);
        this.clearAfterLast();
        this.refreshEmphasis();
    }
    refreshDisplay() {
        this.correctOffset();
        if (this.offset !== this.lastOffset) {
            this.lastOffset = this.offset;
            return this.refreshScreen();
        }
        let file = this.currentFile;
        while (file) {
            file.draw(this.cli, this.offset);
            let nextFile = file.nextSibling;
            while (!!file && !nextFile) {
                nextFile = file.nextSibling;
                file = file.parent;
            }
            file = nextFile;
        }
        this.clearAfterLast();
        this.refreshEmphasis();
        this.cli.goToLine(this.currentFile.position - this.offset);
    }
    clearAfterLast() {
        this.cli.goToLine(this.rootFile.height - this.offset - 1);
        while (this.cli.y < this.cli.maxHeight) {
            this.cli.down();
            this.cli.clearLine();
        }
    }
    refreshEmphasis() {
        if (this.previousFile)
            this.previousFile.draw(this.cli, this.offset, false, false);
        if (this.currentFile)
            this.currentFile.draw(this.cli, this.offset, false, true);
    }
    onInput(keyName, ctrl, shift) {
        if (this.isDead)
            return;
        if (keyName === 'space')
            keyName = ' ';
        if (keyName.length === 1) {
            if (shift)
                keyName = keyName.toUpperCase();
            switch (keyName) {
                case 'q':
                    this.cli.toggleCursor(true);
                    process.exit(0);
                case 'r':
                    if (this.currentFile.isDirectory) {
                        this.rootFile = this.currentFile;
                        this.rootFile.parent = null;
                        this.refreshDisplay();
                    }
                    break;
                case 'x':
                    this.currentFile = this.currentFile.close(ctrl || shift);
                    this.refreshDisplay();
                    break;
                case 'z':
                    this.offset =
                        this.currentFile.position -
                            ((this.cli.maxHeight / 2) >> 0);
                    this.refreshDisplay();
                    break;
                case '.':
                    this.rootFile.toggleHidden();
                    this.refreshScreen();
            }
        }
        else {
            switch (keyName) {
                case 'f5':
                    this.refreshScreen();
                    break;
                case 'left':
                    this.currentFile = this.currentFile.close(ctrl || shift);
                    this.refreshDisplay();
                    break;
                case 'right':
                    if (!this.currentFile.isDirectory)
                        this.fileOpenListener(this.currentFile);
                    else {
                        this.currentFile.open(ctrl || shift ? 5 : 0);
                        this.refreshDisplay();
                    }
                    break;
                case 'up':
                    if (shift || ctrl) {
                        let nextFile = this.currentFile;
                        while (!!nextFile.previousSibling)
                            nextFile = nextFile.previousSibling;
                        this.currentFile = nextFile;
                    }
                    else
                        this.currentFile = this.currentFile.previous;
                    if (this.offset > 0 &&
                        this.currentFile.position - this.offset <= 0) {
                        this.refreshDisplay();
                    }
                    else {
                        this.refreshEmphasis();
                    }
                    break;
                case 'down':
                    if (shift || ctrl) {
                        let nextFile = this.currentFile;
                        while (!!nextFile.nextSibling)
                            nextFile = nextFile.nextSibling;
                        this.currentFile = nextFile;
                    }
                    else
                        this.currentFile = this.currentFile.next;
                    if (this.currentFile.position - this.offset >
                        this.cli.maxHeight) {
                        this.refreshDisplay();
                    }
                    else {
                        this.refreshEmphasis();
                    }
                    break;
                case 'delete':
                    const file = this.currentFile;
                    this.currentFile = this.currentFile.previous;
                    // file.remove();
                    this.refreshDisplay();
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
        this.cli.goToLine(this.currentFile.position - this.offset);
    }
}
async function explore(path) {
    return new Promise(resolve => {
        new Explorer(path, file => {
            resolve(file);
        });
    });
}
export { Explorer, explore };
if (/explorer\.js$/.test(process.argv[1])) {
    if (NO_ARGS_PROVIDED)
        process.exit(1);
    const inPath = process.argv[2];
    const cli = Cli.getInstance();
    const exp = new Explorer(path.resolve(inPath), file => {
        cli.offHitKey();
        openFile(file.path).then(() => {
            cli.onKeyHit(exp.onInput.bind(exp));
            cli.toggleCursor(false);
        });
    });
}
//# sourceMappingURL=explorer.js.map