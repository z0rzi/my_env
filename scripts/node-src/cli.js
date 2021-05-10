import { createInterface } from 'readline';
import { QuickScore } from 'quick-score';
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

class Cli {
    x = 0;
    y = 0;

    maxHeight = 20;
    get maxWidth() {
        return process.stdout.rows
    }

    constructor(height = 30) {
        process.stdin.setRawMode(true);
        this.maxHeight = height;
        let cnt = height;
        while (cnt--) console.log('');
        this.y = height;

        this.up(height);
        this.sol();
    }

    up(n = 1) {
        if (this.y - n <= 0) n = this.y;
        if (n === 0) return;
        if (n < 0) {
            this.down(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}A`);
        this.y -= n;
    }
    down(n = 1) {
        if (this.y + n >= this.maxHeight) n = this.maxHeight - this.y;
        if (n === 0) return;
        if (n < 0) {
            this.up(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}B`);
        this.y += n;
    }
    right(n = 1) {
        if (this.x + n >= this.maxWidth) n = this.maxWidth - this.x;
        if (n === 0) return;
        if (n < 0) {
            this.left(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}C`);
        this.x += n;
    }
    left(n = 1) {
        if (this.x - n <= 0) n = this.x;
        if (n === 0) return;
        if (n < 0) {
            this.right(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}D`);
        this.x -= n;
    }

    goTo(x = this.x, y = this.y) {
        this.sol();
        this.right(x - this.x);
        this.down(y - this.y);
    }

    goToLine(y = this.y) {
        this.goTo(undefined, y);
    }

    goToCol(x = this.x) {
        this.goTo(x, undefined);
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
        process.stdout.write(`\x1b[2J`);
        this.sol();
        this.up(5000);
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
     *
     * @param lines {string}
     */
    write(lines) {
        lines = lines.split(/\n/);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            process.stdout.write(line.slice(0, this.maxWidth - this.x));
            this.x += line.length;
            if (i < lines.length - 1) {
                this.down();
                this.sol();
            }
        }
    }

    changeLine(y, str) {
        this.goToLine(y);
        this.clearLine();
        this.write(str);
    }

    onKeyPress = ((str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.exit();
        } else {
            if (!this.hitListener) return;
            this.hitListener(
                key.name || str || key.sequence,
                key.ctrl,
                key.shift
            );
        }
    }).bind(this);

    hitListener = null;
    onKeyHit(cb) {
        if (this.hitListener) this.offHitKey();

        this.hitListener = cb;
        process.stdin.on('keypress', this.onKeyPress);
    }

    offHitKey() {
        process.stdin.off('keypress', this.onKeyPress);
        rl.close();
        this.hitListener = null;
    }
}

function formatNum(num, length = 4) {
    return String(num).length >= length ? num : formatNum('0' + num, length);
}
function alphaSort(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

class FuzzyFinder {
    height = 30;
    selectorWidth = 3;

    _qs = null;

    cli = null;
    search = '';
    caretPos = 0;
    selectionPos = 0;

    debugMode = false;

    /** @type {{label: string, tags: string}[]} */
    choices = [];

    /** @type {{label: string, tags: string}[]} */
    filteredChoices = [];
    selectCb = null;

    /**
     * constructor.
     *
     * @param choices {{label: string, tags: string}[]}
     */
    constructor(choices, selectCallback) {
        choices.forEach((choice, idx) => {
            // prefixing tags with index so they can be sorted by last usage
            choice.tags = `${formatNum(idx, 4)} ${choice.tags}`;
        });
        this.choices = choices;
        this._qs = new QuickScore(choices, ['tags']);
        this.height = Math.min(this.height, choices.length)
        this.cli = new Cli(this.height)
        this.cli.onKeyHit(this.onInput.bind(this));
        this.selectCb = selectCallback;
        this.refreshResults();
        this.moveSelection();
        this.cli.goTo(0, this.height - 1);
    }

    filterResults() {
        if (!this.search) return this.choices.slice(0, this.height - 1);

        const res = this._qs.search(this.search);
        return res
            .filter(elem => elem.score > 0.5)
            .map(elem => elem.item)
            .sort((a, b) => {
                const aNum = Number(a.tags.slice(0, 4));
                const bNum = Number(b.tags.slice(0, 4));
                if (aNum > 20 && bNum > 20)
                    // keeping last 20 used on top if they match the search
                    return 0
                return aNum - bNum;
            })
            .slice(0, this.height - 1);
    }

    moveSelection(direction) {
        this.cli.goToLine(this.height - 2 - this.selectionPos);
        this.cli.sol();
        this.cli.write(' '.repeat(this.selectorWidth));
        if (direction === 'down') this.selectionPos++;
        else if (direction === 'up') this.selectionPos--;
        if (this.selectionPos >= this.filteredChoices.length)
            this.selectionPos = this.filteredChoices.length - 1;

        if (this.selectionPos < 0) this.selectionPos = 0;

        this.cli.goToLine(this.height - 2 - this.selectionPos);
        this.cli.sol();
        this.cli.write('>  '.slice(0, this.selectorWidth));
    }

    refreshResults() {
        let line = this.height - 2;
        this.filteredChoices = this.filterResults();
        this.cli.goTo(this.selectorWidth, line);
        this.cli.clearToEndOfLine();
        for (const choice of this.filteredChoices) {
            let display = choice.label;
            if (this.debugMode) {
                display += ' - ' + choice.tags.replace(/^[^a-zA-Z]*/, '');
            }
            this.cli.write(display);
            line--;
            if (line < 0) break;
            this.cli.goTo(this.selectorWidth, line);
            this.cli.clearToEndOfLine();
        }
        if (line > 0) {
            this.moveSelection();
            this.cli.goToLine(line);
            this.cli.clearToEndOfLine();
            while (line--) {
                this.cli.goToLine(line);
                this.cli.clearToEndOfLine();
            }
        }
    }

    refreshSearch() {
        this.cli.goToLine(this.height - 1);
        this.cli.clearLine();
        this.cli.write(this.search);
    }

    onInput(keyName, ctrl, shift) {
        if (keyName === 'space') keyName = ' ';
        this.cli.goTo(this.caretPos, this.height - 1);
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
                    this.cli.goToCol(0);
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
        } else if (keyName.length === 1) {
            if (shift) keyName = keyName.toUpperCase();
            this.search =
                this.search.slice(0, this.caretPos) +
                keyName +
                this.search.slice(this.caretPos);
            this.refreshSearch();
            this.cli.goToCol(this.caretPos + 1);
        } else {
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
                        this.search.slice(
                            this.caretPos + 1,
                            this.search.length
                        );
                    this.refreshSearch();
                    this.cli.goToCol(this.caretPos);
                    break;

                case 'f1':
                    this.debugMode = !this.debugMode;
                    this.refreshResults();
                    this.cli.goToCol(this.caretPos);
                    break;

                case 'f5':
                    this.refreshResults();
                    this.cli.goToCol(this.caretPos);
                    break;

                case 'left':
                    this.cli.left();
                    break;

                case 'right':
                    if (this.caretPos >= this.search.length) break;
                    this.cli.right();
                    break;

                case 'up':
                    this.moveSelection('down');
                    this.cli.goToCol(this.caretPos);
                    break;

                case 'down':
                    this.moveSelection('up');
                    this.cli.goToCol(this.caretPos);
                    break;

                case 'return':
                    if (this.filteredChoices[this.selectionPos]) {
                        this.selectCb(this.filteredChoices[this.selectionPos]);
                        this.cli.offHitKey();
                    }
                    break;

                case 'escape':
                    this.selectCb(this.filteredChoices[this.selectionPos]);
                    this.cli.offHitKey();
                    break;
            }
        }
        this.caretPos = this.cli.x;
        if (this.search !== oldSearch) this.refreshResults();
        this.cli.goTo(this.caretPos, this.height - 1);
    }
}

export { Cli, FuzzyFinder };
