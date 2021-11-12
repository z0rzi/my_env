import { __awaiter } from "tslib";
import { Keyboard } from './keyboard.js';
import { cmd } from './shell.js';
function getCursorPosition() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            getPositionRetry(true, (x, y) => {
                resolve({ x, y });
            });
        });
    });
}
function getPositionRetry(retry, oncursor) {
    process.stdin.setRawMode(true);
    process.stdin.on('data', ondata);
    process.stdout.write('\x1b[6n');
    const written = process.stdout.bytesWritten;
    function ondata(data) {
        if (data[0] !== 0x1b && data[1] !== 0x5b)
            return;
        process.stdin.setRawMode(false);
        process.stdin.removeListener('data', ondata);
        if (written !== process.stdout.bytesWritten && retry)
            return getPositionRetry(false, oncursor);
        const [y, x] = data
            .slice(2, data.length - 1)
            .toString()
            .split(';')
            .map(Number);
        oncursor(x - 1, y - 1);
    }
}
export var CliColor;
(function (CliColor) {
    CliColor[CliColor["BLACK"] = 0] = "BLACK";
    CliColor[CliColor["RED"] = 1] = "RED";
    CliColor[CliColor["GREEN"] = 2] = "GREEN";
    CliColor[CliColor["YELLOW"] = 3] = "YELLOW";
    CliColor[CliColor["BLUE"] = 4] = "BLUE";
    CliColor[CliColor["MAGENTA"] = 5] = "MAGENTA";
    CliColor[CliColor["CYAN"] = 6] = "CYAN";
    CliColor[CliColor["GRAY"] = 7] = "GRAY";
})(CliColor || (CliColor = {}));
class Cli {
    constructor(lines = -1, cols = -1, yOffset = -1, xOffset = -1) {
        this.x = 0;
        this.y = 0;
        this.cursorOn = true;
        this._height_offset = 0;
        this.maxHeight = 20;
        this._termMetas = {
            height: 20,
            width: 200,
            offset: {
                lines: 0,
                cols: 0,
            },
        };
        this._readyResolve = null;
        this.isReady = false;
        this.waitForReady = new Promise(resolve => {
            this._readyResolve = resolve;
        });
        this._positions = {};
        this.onKeyPress = ((key) => {
            if (!this.hitListener)
                return;
            this.hitListener(key.key, key.ctrl, key.shift, key.alt);
        }).bind(this);
        this.hitListener = null;
        this._borrowList = {};
        this.kb = Keyboard.getInstance();
        this.clearScreen();
        this.refreshTermMetas().then(() => {
            this.updateHeight(lines);
            this._readyResolve();
            if (cols > 0)
                this._termMetas.width = Math.min(cols, this._termMetas.width);
            if (xOffset > 0)
                this._termMetas.offset.cols = xOffset;
            if (yOffset > 0) {
                if (this._termMetas.height - yOffset < 10) {
                    console.log('\n'.repeat(10 - (this._termMetas.height - yOffset)));
                    this._termMetas.offset.lines = 10;
                }
                else {
                    this._termMetas.offset.lines = yOffset;
                }
            }
            this.clearScreen();
            this.isReady = true;
        });
    }
    get maxWidth() {
        return this._termMetas.width - this._termMetas.offset.cols;
    }
    refreshTermMetas() {
        return __awaiter(this, void 0, void 0, function* () {
            this._termMetas.height = yield cmd('tput lines').then(Number);
            this._termMetas.width = yield cmd('tput cols').then(Number);
            this._termMetas.offset.lines = yield getCursorPosition().then(({ y: yOffset }) => {
                if (this._termMetas.height - yOffset < 10) {
                    console.log('\n'.repeat(13));
                    return 10;
                }
                else {
                    return yOffset;
                }
            });
        });
    }
    color(color) {
        process.stdout.write(`\x1b[0;${90 + color}m`);
    }
    bold() {
        process.stdout.write(`\x1b[1m`);
    }
    italic() {
        process.stdout.write(`\x1b[3m`);
    }
    underline() {
        process.stdout.write(`\x1b[4m`);
    }
    clearAllStyles() {
        process.stdout.write('\x1b[0m');
    }
    updateHeight(newHeight) {
        const oldHeight = this.maxHeight;
        if (newHeight < 0)
            this.maxHeight =
                this._termMetas.height - this._termMetas.offset.lines - 1;
        else
            this.maxHeight = Math.min(newHeight, this._termMetas.height - 1);
        const availableSpace = this._termMetas.height - this._termMetas.offset.lines;
        if (availableSpace < this.maxHeight) {
            this.savePos('__updateHeight__');
            this.goTo(oldHeight, 0);
            console.log('\n'.repeat(Math.max(1, this.maxHeight - oldHeight)));
            this.y = this.maxHeight;
            this.loadPos('__updateHeight__');
            this._termMetas.offset.lines =
                this._termMetas.height - this.maxHeight;
        }
    }
    /**
     * Saves the current position of the cursor, to be loaded later
     *
     * @param tag A key to be associated with this position
     */
    savePos(tag = null) {
        tag = tag || '__tmp__';
        this._positions[tag] = {
            x: this.x,
            y: this.y,
        };
    }
    /**
     * Moves the cursor to a saved position
     *
     * @param tag The key provided to the save function.
     */
    loadPos(tag = null) {
        tag = tag || '__tmp__';
        if (!(tag in this._positions)) {
            throw new Error('Trying to load non saved position!');
        }
        const { x, y } = this._positions[tag];
        this.goTo(y, x);
    }
    _refreshCurPos(line = this.y, col = this.x) {
        const move = () => process.stdout.write(`\x1b[${this._termMetas.offset.lines + line + 1};${this._termMetas.offset.cols + col + 1}H`);
        if (this.isReady)
            move();
        else
            this.waitForReady.then(move);
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
        this.y -= n;
        this._refreshCurPos();
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
        this.y += n;
        this._refreshCurPos();
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
        this.x += n;
        this._refreshCurPos();
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
        this.x -= n;
        this._refreshCurPos();
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
        this.left(1000);
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
    }
    /**
     * Clears the current line
     */
    clearLine() {
        this.sol();
        this.clearToEndOfLine();
    }
    clearToEndOfLine() {
        if (this.isReady) {
            this.savePos('cteof');
            this.write(' '.repeat(this.maxWidth));
            this.x = this.maxWidth;
            this.loadPos('cteof');
        }
        else
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
        if (styleOpts && 'italic' in styleOpts && styleOpts.italic)
            this.italic();
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
    toggleCursor(flag) {
        if (typeof flag === 'boolean')
            this.cursorOn = flag;
        else
            this.cursorOn = !this.cursorOn;
        if (this.cursorOn)
            process.stdout.write('\x1B[?25h');
        else
            process.stdout.write('\x1B[?25l');
    }
    testColors() {
        this.clearScreen();
        this.write('RED', { color: CliColor.RED });
        this.down();
        this.sol();
        this.write('BLUE', { color: CliColor.BLUE });
        this.down();
        this.sol();
        this.write('YELLOW', { color: CliColor.YELLOW });
        this.down();
        this.sol();
        this.write('CYAN', { color: CliColor.CYAN });
        this.down();
        this.sol();
        this.write('GREEN', { color: CliColor.GREEN });
        this.down();
        this.sol();
        this.write('MAGENTA', { color: CliColor.MAGENTA });
        this.down();
        this.sol();
        this.write('GRAY', { color: CliColor.GRAY });
        this.down();
        this.sol();
        this.write('BLACK', { color: CliColor.BLACK });
        process.exit(0);
    }
    changeLine(y, str) {
        this.goToLine(y);
        this.clearLine();
        this.write(str);
    }
    onKeyHit(cb) {
        this.kb.onKeyPress(this.onKeyPress);
        this.hitListener = cb;
    }
    borrowHitKey(key, cb) {
        this._borrowList[key] = this.hitListener;
        this.onKeyHit(cb);
    }
    giveBackHitKey(key) {
        this.onKeyHit(this._borrowList[key]);
    }
    offHitKey() {
        this.kb.offKeyPress();
        this.hitListener = null;
    }
}
export { Cli };
//# sourceMappingURL=cli.js.map