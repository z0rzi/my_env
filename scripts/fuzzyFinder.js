import { QuickScore } from 'quick-score';
import { Cli, CliColor } from './cli.js';
import { Prompt } from './prompt.js';
class FuzzyFinder {
    constructor(choices, selectCallback, scoreLimit = 0.5, cli = null) {
        this.height = 100;
        this.selectorWidth = 3;
        this.isDead = false;
        this._qs = null;
        this.cli = null;
        this.search = '';
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
        this._qs = new QuickScore(choices, ['label', 'tags']);
        this.height = Math.min(this.height, choices.length + 1);
        this.cli = cli ?? new Cli(this.height);
        this.cli.waitForReady.then(() => {
            this.height = this.cli.maxHeight;
            const p = new Prompt(this.cli, this.height - 1, 0);
            p.onChange = (text) => {
                this.search = text;
                this.refreshAllResults();
                return false;
            };
            p.onKeyHit = (key) => {
                switch (key) {
                    case 'f1':
                        this.debugMode = !this.debugMode;
                        this.refreshAllResults();
                        break;
                    case 'f5':
                        this.refreshAllResults();
                        break;
                    case 'up':
                        this.moveSelection('down');
                        break;
                    case 'down':
                        this.moveSelection('up');
                        break;
                }
                return true;
            };
            p.onConfirm = () => {
                if (this.filteredChoices[this.selectionPos]) {
                    this.selectCb(this.filteredChoices[this.selectionPos]);
                    this.end();
                    return true;
                }
                return false;
            };
            p.onCancel = () => {
                this.selectCb();
                this.cli.offHitKey();
                this.end();
                return true;
            };
            this.selectCb = selectCallback;
            this.refreshAllResults();
            this.moveSelection();
            this.cli.goTo(this.height - 1, 0);
        });
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
        const out = res
            .filter(elem => elem.score > this.scoreLimit ||
            // Checking for exact matches
            Object.values(elem.matches).some(subMatches => subMatches.length === 1))
            .map(elem => {
            return {
                ...elem.item,
                _matches: elem.matches.label,
            };
        })
            .sort((a, b) => {
            const aNum = Number(a.tags.slice(0, 4));
            const bNum = Number(b.tags.slice(0, 4));
            if (aNum > 30 && bNum > 30)
                // keeping last 30 used on top if they match the search
                return 0;
            return aNum - bNum;
        })
            .slice(0, this.height - 1);
        return out;
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
        if (choice._matches && choice._matches.length) {
            let idx = 0;
            for (const [start, end] of choice._matches) {
                this.cli.write(choice.label.slice(idx, start), {
                    bold: index === this.selectionPos,
                });
                this.cli.write(choice.label.slice(start, end), {
                    color: CliColor.GREEN,
                    bold: index === this.selectionPos,
                });
                idx = end;
            }
            this.cli.write(choice.label.slice(idx), {
                bold: index === this.selectionPos,
            });
        }
        else {
            this.cli.write(choice.label, { bold: index === this.selectionPos });
        }
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
}
function formatNum(num, length = 4) {
    return String(num).length >= length ? num : formatNum('0' + num, length);
}
async function fuzzyFind(choices, scoreLimit = 0.5, cli = null) {
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
        }, scoreLimit, cli);
    });
}
export { FuzzyFinder, fuzzyFind };
//# sourceMappingURL=fuzzyFinder.js.map