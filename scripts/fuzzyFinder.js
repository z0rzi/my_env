import { Cli, CliColor } from './cli.js';
import { QuickScore } from 'quick-score';
class FuzzyFinder {
    constructor(choices, selectCallback, scoreLimit = 0.5) {
        this.height = 30;
        this.selectorWidth = 3;
        this.isDead = false;
        this._qs = null;
        this.cli = null;
        this.search = '';
        this.caretPos = 0;
        this.selectionPos = 0;
        this.scoreLimit = 0.5;
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
        this.cli.write('>  '.slice(0, this.selectorWidth), {
            color: CliColor.GREEN,
            bold: true,
        });
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
            this.cli.write(' - ' + choice.tags.replace(/^[^a-zA-Z]*/, ''), {
                color: CliColor.BLACK,
            });
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
                        this.cli.goTo(this.height - 1, this.caretPos);
                        this.end();
                        return;
                    }
                    break;
                case 'escape':
                    this.selectCb();
                    this.cli.offHitKey();
                    this.end();
                    break;
            }
        }
        this.caretPos = this.cli.x;
        if (this.search !== oldSearch)
            this.refreshAllResults();
        this.cli.goTo(this.height - 1, this.caretPos);
    }
}
function formatNum(num, length = 4) {
    return String(num).length >= length ? num : formatNum('0' + num, length);
}
async function fuzzyFind(choices, scoreLimit = 0.5) {
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
}
export { FuzzyFinder, fuzzyFind };
//# sourceMappingURL=fuzzyFinder.js.map