import { __awaiter } from "tslib";
import * as readline from 'readline';
import { QuickScore } from 'quick-score';
import { cmd } from './shell.js';
var CliColor;
(function (CliColor) {
    CliColor[CliColor["BLACK"] = 0] = "BLACK";
    CliColor[CliColor["RED"] = 1] = "RED";
    CliColor[CliColor["GREEN"] = 2] = "GREEN";
    CliColor[CliColor["YELLOW"] = 3] = "YELLOW";
    CliColor[CliColor["BLUE"] = 4] = "BLUE";
    CliColor[CliColor["MAGENTA"] = 5] = "MAGENTA";
    CliColor[CliColor["CYAN"] = 6] = "CYAN";
    CliColor[CliColor["WHITE"] = 7] = "WHITE";
})(CliColor || (CliColor = {}));
class Cli {
    constructor(height = 30) {
        this.x = 0;
        this.y = 0;
        this.maxHeight = 20;
        this._maxWidth = -1;
        this._positions = {};
        this.onKeyPress = ((str, key) => {
            if (key.ctrl && key.name === 'c') {
                process.exit();
            }
            else {
                if (!this.hitListener)
                    return;
                this.hitListener(key.name || str || key.sequence, key.ctrl, key.shift);
            }
        }).bind(this);
        this.hitListener = null;
        process.stdin.setRawMode(true);
        this.updateHeight(height);
        readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
            historySize: 0,
            tabSize: 4,
            crlfDelay: 10
        });
        process.stdin.on('keypress', this.onKeyPress);
        this.up(height);
        this.sol();
    }
    static getInstance(height = 30) {
        if (!this._instance) {
            this._instance = new Cli(height);
        }
        if (height !== this._instance.height) {
            this._instance.clearScreen();
            this._instance.updateHeight(height);
        }
        return this._instance;
    }
    get maxWidth() {
        if (this._maxWidth > 0)
            return this._maxWidth;
        if (this._maxWidth < 0) {
            cmd('tput cols')
                .then(width => {
                this._maxWidth = Number(width);
            });
            this._maxWidth = 0;
        }
        return 200;
    }
    color(color) {
        process.stdout.write(`\x1b[0;${90 + color}m`);
    }
    bold() {
        process.stdout.write(`\x1b[1m`);
    }
    underline() {
        process.stdout.write(`\x1b[4m`);
    }
    clearAllStyles() {
        process.stdout.write('\x1b[0m');
    }
    updateHeight(newHeight) {
        this.maxHeight = newHeight;
        this.savePos('__updateHeight__');
        this.goTo(0, 0);
        let cnt = newHeight;
        while (cnt--)
            console.log('');
        this.y = newHeight;
        this.loadPos('__updateHeight__');
    }
    savePos(tag = null) {
        tag = tag || '__tmp__';
        this._positions[tag] = {
            x: this.x,
            y: this.y,
        };
    }
    loadPos(tag = null) {
        tag = tag || '__tmp__';
        if (!(tag in this._positions)) {
            throw new Error('Trying to load non saved position!');
        }
        const { x, y } = this._positions[tag];
        this.goTo(y, x);
    }
    up(n = 1) {
        if (this.y - n <= 0)
            n = this.y;
        if (n === 0)
            return;
        if (n < 0) {
            this.down(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}A`);
        this.y -= n;
    }
    down(n = 1) {
        if (this.y + n >= this.maxHeight)
            n = this.maxHeight - this.y;
        if (n === 0)
            return;
        if (n < 0) {
            this.up(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}B`);
        this.y += n;
    }
    right(n = 1) {
        if (this.x + n >= this.maxWidth)
            n = this.maxWidth - this.x;
        if (n === 0)
            return;
        if (n < 0) {
            this.left(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}C`);
        this.x += n;
    }
    left(n = 1) {
        if (this.x - n <= 0)
            n = this.x;
        if (n === 0)
            return;
        if (n < 0) {
            this.right(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}D`);
        this.x -= n;
    }
    goTo(y = this.y, x = this.x) {
        this.sol();
        this.down(y - this.y);
        this.right(x - this.x);
    }
    goToLine(y = this.y) {
        this.goTo(y, undefined);
    }
    goToCol(x = this.x) {
        this.goTo(undefined, x);
    }
    /**
     * Puts the cursor to the start of line
     */
    sol() {
        process.stdout.write(`\x1b[1000D`);
        this.x = 0;
    }
    /**
     * Clears the whole screen and puts cursor on top
     */
    clearScreen() {
        this.goToLine(this.maxHeight);
        this.clearLine();
        while (this.y > 0) {
            this.up();
            this.clearLine();
        }
        // process.stdout.write(`\x1b[2J`);
        // this.sol();
        // this.up(5000);
    }
    /**
     * Clears the current line
     */
    clearLine() {
        this.sol();
        this.clearToEndOfLine();
    }
    clearToEndOfLine() {
        process.stdout.write('\x1b[K');
    }
    /**
     * writes a message to the screen
     */
    write(text, styleOpts = {}) {
        if (styleOpts && 'color' in styleOpts)
            this.color(styleOpts.color);
        if (styleOpts && 'bold' in styleOpts && styleOpts.bold)
            this.bold();
        if (styleOpts && 'underline' in styleOpts && styleOpts.underline)
            this.underline();
        const lines = text.split(/\n/);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            process.stdout.write(line.slice(0, this.maxWidth - this.x));
            this.x += line.length;
            if (i < lines.length - 1) {
                this.down();
                this.sol();
            }
        }
        this.clearAllStyles();
    }
    changeLine(y, str) {
        this.goToLine(y);
        this.clearLine();
        this.write(str);
    }
    onKeyHit(cb) {
        if (this.hitListener)
            this.offHitKey();
        this.hitListener = cb;
    }
    offHitKey() {
        this.hitListener = null;
    }
}
Cli._instance = null;
function formatNum(num, length = 4) {
    return String(num).length >= length ? num : formatNum('0' + num, length);
}
class FuzzyFinder {
    constructor(choices, selectCallback, scoreLimit = .5) {
        this.height = 30;
        this.selectorWidth = 3;
        this.isDead = false;
        this._qs = null;
        this.cli = null;
        this.search = '';
        this.caretPos = 0;
        this.selectionPos = 0;
        this.scoreLimit = .5;
        this.debugMode = false;
        this.choices = [];
        this.filteredChoices = [];
        this.selectCb = null;
        this.scoreLimit = scoreLimit;
        choices.forEach((choice, idx) => {
            // prefixing tags with index so they can be sorted by last usage
            choice.tags = `${formatNum(idx, 4)} ${choice.tags}`;
        });
        this.choices = choices;
        this._qs = new QuickScore(choices, ['tags']);
        this.height = Math.min(this.height, choices.length + 1);
        this.cli = Cli.getInstance(this.height);
        this.cli.onKeyHit(this.onInput.bind(this));
        this.selectCb = selectCallback;
        this.refreshAllResults();
        this.moveSelection();
        this.cli.goTo(this.height - 1, 0);
    }
    end() {
        this.isDead = true;
        this.search = '';
        this.choices = [];
        this.filteredChoices = [];
        this.selectCb = () => { };
    }
    filterResults() {
        if (this.isDead)
            return;
        if (!this.search)
            return this.choices.slice(0, this.height - 1);
        const res = this._qs.search(this.search);
        return res
            .filter(elem => elem.score > this.scoreLimit)
            .map(elem => elem.item)
            .sort((a, b) => {
            const aNum = Number(a.tags.slice(0, 4));
            const bNum = Number(b.tags.slice(0, 4));
            if (aNum > 20 && bNum > 20)
                // keeping last 20 used on top if they match the search
                return 0;
            return aNum - bNum;
        })
            .slice(0, this.height - 1);
    }
    /**
     * Updates the selection arrow
     *
     * @param direction Up or down. If nothing is provided, simply redraw the arrow
     */
    moveSelection(direction) {
        if (this.isDead)
            return;
        this.cli.savePos('move-sel');
        this.cli.goToLine(this.height - 2 - this.selectionPos);
        this.cli.sol();
        this.cli.write(' '.repeat(this.selectorWidth));
        const oldSelPos = this.selectionPos;
        if (direction === 'down')
            this.selectionPos++;
        else if (direction === 'up')
            this.selectionPos--;
        if (this.selectionPos >= this.filteredChoices.length)
            this.selectionPos = this.filteredChoices.length - 1;
        if (this.selectionPos < 0)
            this.selectionPos = 0;
        this.cli.goToLine(this.height - 2 - this.selectionPos);
        this.cli.sol();
        this.cli.write('>  '.slice(0, this.selectorWidth), { color: CliColor.GREEN, bold: true });
        this.refreshOneResult(oldSelPos);
        this.refreshOneResult(this.selectionPos);
        this.cli.loadPos('move-sel');
    }
    refreshOneResult(index = this.selectionPos) {
        if (this.isDead)
            return;
        if (index >= this.filteredChoices.length)
            return;
        this.cli.goTo(this.height - 2 - index, this.selectorWidth);
        this.cli.clearToEndOfLine();
        const choice = this.filteredChoices[index];
        this.cli.write(choice.label, { bold: this.selectionPos === index });
        if (this.debugMode)
            this.cli.write(' - ' + choice.tags.replace(/^[^a-zA-Z]*/, ''), { color: CliColor.BLACK });
    }
    refreshAllResults() {
        if (this.isDead)
            return;
        this.cli.savePos('refresh');
        this.filteredChoices = this.filterResults();
        this.filteredChoices.forEach((_, idx) => {
            this.refreshOneResult(idx);
        });
        for (let idx = this.filteredChoices.length; idx < this.height - 1; idx++) {
            this.cli.goToLine(this.height - 2 - idx);
            this.cli.clearLine();
        }
        this.moveSelection();
        this.cli.loadPos('refresh');
    }
    refreshSearch() {
        if (this.isDead)
            return;
        this.cli.goToLine(this.height - 1);
        this.cli.clearLine();
        this.cli.write(this.search);
    }
    onInput(keyName, ctrl, shift) {
        if (this.isDead)
            return;
        if (keyName === 'space')
            keyName = ' ';
        this.cli.goTo(this.height - 1, this.caretPos);
        const oldSearch = this.search;
        if (ctrl) {
            switch (keyName) {
                case 'a':
                    this.cli.goToCol(0);
                    break;
                case 'e':
                    this.cli.goToCol(this.search.length);
                    break;
                case 'u':
                    this.search = this.search.slice(this.caretPos);
                    this.refreshSearch();
                    this.cli.sol();
                    break;
                case 'w':
                    const cutBit = this.search
                        .slice(0, this.caretPos)
                        .replace(/(?:^|\s)\S*$/, '');
                    this.search = cutBit + this.search.slice(this.caretPos);
                    this.refreshSearch();
                    this.cli.goToCol(cutBit.length);
                    break;
            }
        }
        else if (keyName.length === 1) {
            if (shift)
                keyName = keyName.toUpperCase();
            this.search =
                this.search.slice(0, this.caretPos) +
                    keyName +
                    this.search.slice(this.caretPos);
            this.refreshSearch();
            this.cli.goToCol(this.caretPos + 1);
        }
        else {
            switch (keyName) {
                case 'backspace':
                    this.search =
                        this.search.slice(0, this.caretPos - 1) +
                            this.search.slice(this.caretPos, this.search.length);
                    this.refreshSearch();
                    this.cli.goToCol(this.caretPos - 1);
                    break;
                case 'delete':
                    this.search =
                        this.search.slice(0, this.caretPos) +
                            this.search.slice(this.caretPos + 1, this.search.length);
                    this.refreshSearch();
                    this.cli.goToCol(this.caretPos);
                    break;
                case 'f1':
                    this.debugMode = !this.debugMode;
                    this.refreshAllResults();
                    this.cli.goToCol(this.caretPos);
                    break;
                case 'f5':
                    this.refreshAllResults();
                    this.cli.goToCol(this.caretPos);
                    break;
                case 'left':
                    this.cli.left();
                    break;
                case 'right':
                    if (this.caretPos >= this.search.length)
                        break;
                    this.cli.right();
                    break;
                case 'up':
                    this.moveSelection('down');
                    break;
                case 'down':
                    this.moveSelection('up');
                    break;
                case 'return':
                    if (this.filteredChoices[this.selectionPos]) {
                        this.selectCb(this.filteredChoices[this.selectionPos]);
                        this.cli.goTo(this.height - 2, this.caretPos);
                        this.cli.offHitKey();
                        this.end();
                        return;
                    }
                    break;
                case 'escape':
                    this.selectCb();
                    this.cli.offHitKey();
                    break;
            }
        }
        this.caretPos = this.cli.x;
        if (this.search !== oldSearch)
            this.refreshAllResults();
        this.cli.goTo(this.height - 1, this.caretPos);
    }
}
function fuzzyFind(choices, scoreLimit = .5) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!Array.isArray(choices))
            throw new Error('Choices must be an array!');
        if (!choices.length)
            throw new Error('No empty array!');
        choices = choices.map((choice) => {
            if (typeof choice === 'string')
                return { label: choice, tags: choice };
            return choice;
        });
        return new Promise((resolve, reject) => {
            new FuzzyFinder(choices, choice => {
                if (!choice)
                    reject();
                return resolve(choice);
            }, scoreLimit);
        });
    });
}
export { Cli, FuzzyFinder, fuzzyFind };
//# sourceMappingURL=cli.js.map