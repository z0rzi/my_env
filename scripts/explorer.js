#!/bin/node
import { __awaiter } from "tslib";
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
    open(recursive = 0, openStartTime = 0) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    openToPath(path) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isDirectory ||
                path === this.path ||
                !path.startsWith(this.path))
                return this;
            if (!this.opened)
                yield this.open();
            for (const kid of this.children)
                if (path.startsWith(kid.path))
                    return kid.openToPath(path);
            return this;
        });
    }
    isVisible() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.showHidden && this.isHiddenFile())
                return false;
            if (this.gitOnly) {
                const gitState = yield this.getGitState();
                if (gitState === GitFileState.NONE ||
                    gitState === GitFileState.IGNORED)
                    return false;
            }
            return true;
        });
    }
    getClosestVisible() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.isVisible())
                return this;
            let f = this;
            while (!(yield f.isVisible())) {
                f =
                    (_a = f.previousSibling) !== null && _a !== void 0 ? _a : f.parent;
            }
            return f;
        });
    }
    getVisibleChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.children.asyncFilter((kid) => __awaiter(this, void 0, void 0, function* () { return yield kid.isVisible(); }));
        });
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
    draw(cli, offset = 0, options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({
                drawKids: true,
                emphasis: false,
            }, options);
            if (!this.showHidden && this.isHiddenFile())
                return;
            const gitStateIcon = yield this.getGitState();
            const truePosition = (yield this.getPosition()) - offset;
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
                const textStyle = Object.assign({}, this.textStyle);
                if (options.emphasis)
                    textStyle.underline = true;
                if (!this.isDirectory && /\./.test(this.name)) {
                    const root = this.name.replace(/\.[^.]*$/, '');
                    const extension = this.name.replace(/^.*\./, '');
                    cli.write(`${root}.`, textStyle !== null && textStyle !== void 0 ? textStyle : {});
                    cli.write(`${extension}`, iconStyle);
                }
                else {
                    cli.write(`${this.name}`, textStyle !== null && textStyle !== void 0 ? textStyle : {});
                }
                cli.write(` ${gitStateIcon}`, { italic: true });
            }
            if (this.isDirectory && this.opened && options.drawKids) {
                for (const kid of yield this.getVisibleChildren()) {
                    yield kid.draw(cli, offset, options);
                }
            }
        });
    }
    getPosition() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.parent)
                return 0;
            return yield this.parent.getChildAbsolutePos(this);
        });
    }
    getHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isVisible()))
                return 0;
            if (!this.isDirectory || !this.opened)
                return 1;
            let height = 1;
            for (const kid of yield this.getVisibleChildren())
                height += yield kid.getHeight();
            return height;
        });
    }
    get width() {
        return this.depth * INDENT.length + this.name.length + 2;
    }
    getPrevious() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.parent)
                return this;
            const siblings = yield this.parent.getVisibleChildren();
            const idx = siblings.indexOf(this);
            if (idx === 0)
                return this.parent;
            let prev = siblings[idx - 1];
            let prevKids = yield prev.getVisibleChildren();
            while (prev.isDirectory && prevKids.length && prev.opened) {
                prev = prevKids[prevKids.length - 1];
                prevKids = yield prev.getVisibleChildren();
            }
            return prev;
        });
    }
    getNext() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDirectory && this.opened) {
                const kids = yield this.getVisibleChildren();
                if (kids.length)
                    return kids[0];
            }
            if (!this.parent)
                return this;
            let f = this;
            while (true) {
                const kids = yield f.parent.getVisibleChildren();
                const idx = kids.indexOf(f);
                if (kids.length > idx + 1)
                    return kids[idx + 1];
                f = f.parent;
                if (!f.parent)
                    break;
            }
            return this;
        });
    }
    getChildAbsolutePos(child) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isDirectory || !this.opened || !this.children.length)
                return -1;
            let pos = (yield this.getPosition()) + 1;
            for (const kid of yield this.getVisibleChildren()) {
                if (kid === child)
                    return pos;
                pos += yield kid.getHeight();
            }
            return -1;
        });
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
    correctOffset() {
        return __awaiter(this, void 0, void 0, function* () {
            const curfilepos = yield this.currentFile.getPosition();
            if (curfilepos - this.offset < 0) {
                // current file above screen
                this.offset = curfilepos;
            }
            if (curfilepos - this.offset >= this.cli.maxHeight) {
                // current file below screen
                this.offset = curfilepos - this.cli.maxHeight;
            }
        });
    }
    refreshScreen() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.correctOffset();
            yield this.rootFile.draw(this.cli, this.offset);
            this.cli.goToLine((yield this.currentFile.getPosition()) - this.offset);
            yield this.refreshEmphasis();
            yield this.clearAfterLast();
        });
    }
    refreshDisplay() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.correctOffset();
            if (this.offset !== this.lastOffset) {
                this.lastOffset = this.offset;
                return yield this.refreshScreen();
            }
            let file = this.currentFile;
            while (file) {
                yield file.draw(this.cli, this.offset);
                let nextFile = file.nextSibling;
                while (!!file && !nextFile) {
                    nextFile = file.nextSibling;
                    file = file.parent;
                }
                file = nextFile;
            }
            yield this.clearAfterLast();
            yield this.refreshEmphasis();
            this.cli.goToLine((yield this.currentFile.getPosition()) - this.offset);
        });
    }
    clearAfterLast() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cli.goToLine((yield this.rootFile.getHeight()) - this.offset - 1);
            while (this.cli.y < this.cli.maxHeight) {
                this.cli.down();
                this.cli.clearLine();
            }
        });
    }
    refreshEmphasis() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.previousFile)
                yield this.previousFile.draw(this.cli, this.offset, {
                    drawKids: false,
                    emphasis: false,
                });
            if (this.currentFile)
                yield this.currentFile.draw(this.cli, this.offset, {
                    drawKids: false,
                    emphasis: true,
                });
        });
    }
    createPrompt(initValue = '', col = this.currentFile.width - this.currentFile.name.length, line = this.cli.y) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const p = new Prompt(this.cli, line, col);
                p.value = initValue;
                p.caretPos = initValue.length;
                p.onConfirm = (text) => {
                    this.cli.toggleCursor(false);
                    resolve(text);
                    return true;
                };
                p.onCancel = () => __awaiter(this, void 0, void 0, function* () {
                    this.cli.toggleCursor(false);
                    yield this.refreshEmphasis();
                    reject();
                    return true;
                });
            });
        });
    }
    //
    // Actions
    //
    open(recursive = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentFile.isDirectory)
                this.fileOpenListener(this.currentFile);
            else {
                yield this.currentFile.open(recursive ? 5 : 0);
                yield this.refreshDisplay();
            }
        });
    }
    close(recursive = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentFile = this.currentFile.close(recursive);
            this.refreshDisplay();
        });
    }
    createNew(isDir = false) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const text = yield this.createPrompt();
                this.currentFile.rename(text);
                yield this.refreshDisplay();
            }
            catch (err) {
                // prompt cancel
                const file = this.currentFile;
                this.currentFile = yield this.currentFile.getClosestVisible();
                if (this.currentFile === file)
                    this.currentFile = yield this.currentFile.getPrevious();
                file.remove().then(this.refreshDisplay.bind(this));
            }
        });
    }
    changeRoot() {
        return __awaiter(this, void 0, void 0, function* () {
            // Change root dir
            if (this.currentFile.isDirectory) {
                this.rootFile = this.currentFile;
                this.rootFile.parent = null;
                yield this.refreshDisplay();
            }
        });
    }
    rename() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const text = yield this.createPrompt(this.currentFile.name);
                this.currentFile.rename(text);
                this.refreshDisplay();
            }
            catch (err) {
                // prompt cancel
            }
        });
    }
    goUp(toFirst) {
        return __awaiter(this, void 0, void 0, function* () {
            if (toFirst) {
                this.currentFile = (yield this.currentFile.parent.getVisibleChildren())[0];
            }
            else {
                this.currentFile = yield this.currentFile.getPrevious();
            }
            if (this.offset > 0 &&
                (yield this.currentFile.getPosition()) - this.offset <= 0) {
                this.refreshDisplay();
            }
            else {
                yield this.refreshEmphasis();
            }
        });
    }
    goDown(toLast) {
        return __awaiter(this, void 0, void 0, function* () {
            if (toLast) {
                const siblings = yield this.currentFile.parent.getVisibleChildren();
                this.currentFile = siblings[siblings.length - 1];
            }
            else
                this.currentFile = yield this.currentFile.getNext();
            if ((yield this.currentFile.getPosition()) - this.offset >
                this.cli.maxHeight) {
                this.refreshDisplay();
            }
            else {
                this.refreshEmphasis();
            }
        });
    }
    remove() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cli.goToCol(this.currentFile.width + 1);
            this.cli.write('Sure? ');
            try {
                const text = yield this.createPrompt('', this.currentFile.width + 1 + 'Sure? '.length);
                if (text === 'yes') {
                    const file = this.currentFile;
                    this.currentFile = yield this.currentFile.getNext();
                    if (this.currentFile === file)
                        this.currentFile = yield this.currentFile.getPrevious();
                    file.remove().then(this.refreshDisplay.bind(this));
                }
                yield this.refreshDisplay();
            }
            catch (err) {
                // prompt cancel
            }
        });
    }
    fuzzySearch() {
        return __awaiter(this, void 0, void 0, function* () {
            const allKids = yield this.currentFile.getAllChildren();
            this.cli.toggleCursor(true);
            let choice;
            try {
                choice = yield fuzzyFind(allKids, undefined, this.cli);
            }
            catch (err) {
                this.cli.toggleCursor(false);
                return;
            }
            const path = this.currentFile.path + choice.label.replace(/^\.\//, '');
            this.currentFile = yield this.currentFile.openToPath(path);
            this.cli.toggleCursor(false);
            return;
        });
    }
    onInput(keyName, ctrl, shift) {
        return __awaiter(this, void 0, void 0, function* () {
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
                            yield this.currentFile.getClosestVisible();
                        yield this.refreshScreen();
                        break;
                    case 's':
                        yield this.fuzzySearch();
                        yield this.refreshScreen();
                        break;
                    case 'z':
                        this.offset =
                            (yield this.currentFile.getPosition()) -
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
                            yield this.currentFile.getClosestVisible();
                        yield this.refreshScreen();
                }
            }
            else {
                switch (keyName) {
                    case 'f5':
                        this.currentFile = this.currentFile.refreshChildren();
                        yield this.refreshScreen();
                        break;
                    case 'left':
                        yield this.close(ctrl || shift);
                        break;
                    case 'right':
                        yield this.open(ctrl || shift);
                        break;
                    case 'return':
                        yield this.open(ctrl || shift);
                        break;
                    case 'up':
                        yield this.goUp(shift || ctrl);
                        break;
                    case 'down':
                        yield this.goDown(ctrl || shift);
                        break;
                    case 'delete':
                        yield this.remove();
                        break;
                    case 'backspace':
                        if (this.currentFile.parent) {
                            this.currentFile = this.currentFile.parent;
                            this.currentFile.close();
                        }
                        else {
                            try {
                                this.rootFile =
                                    this.rootFile.findParent();
                                this.currentFile = this.rootFile;
                                this.rootFile.open();
                            }
                            catch (err) {
                                // we're probably at `/`, we do nothing
                            }
                        }
                        this.refreshDisplay();
                        break;
                }
            }
            this.cli.goToLine((yield this.currentFile.getPosition()) - this.offset);
        });
    }
}
function explore(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            new Explorer(path, file => {
                resolve(file);
            });
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