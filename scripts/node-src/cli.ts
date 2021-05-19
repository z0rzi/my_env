import { cmd } from './shell.js';
import { Keyboard, Key } from './keyboard.js';

export enum CliColor {
    BLACK = 0,
    RED = 1,
    GREEN = 2,
    YELLOW = 3,
    BLUE = 4,
    MAGENTA = 5,
    CYAN = 6,
    GRAY = 7,
}

export type StyleOptions = {
    color?: CliColor;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
};

class Cli {
    static _instance = null;
    static getInstance(height = 30): Cli {
        if (!this._instance) {
            this._instance = new Cli(height);
        }
        if (height !== this._instance.height) {
            this._instance.clearScreen();
            this._instance.updateHeight(height);
        }
        return this._instance;
    }

    x = 0;
    y = 0;

    kb: Keyboard;

    maxHeight = 20;
    _maxWidth = -1;
    get maxWidth(): number {
        if (this._maxWidth > 0) return this._maxWidth;

        if (this._maxWidth < 0) {
            cmd('tput cols').then(width => {
                this._maxWidth = Number(width);
            });
            this._maxWidth = 0;
        }
        return 200;
    }

    private constructor(height = 30) {
        this.updateHeight(height);

        this.kb = Keyboard.getInstance();

        this.up(height);
        this.sol();
    }

    color(color: CliColor): void {
        process.stdout.write(`\x1b[0;${90 + color}m`);
    }
    bold(): void {
        process.stdout.write(`\x1b[1m`);
    }
    italic(): void {
        process.stdout.write(`\x1b[3m`);
    }
    underline(): void {
        process.stdout.write(`\x1b[4m`);
    }
    clearAllStyles(): void {
        process.stdout.write('\x1b[0m');
    }

    updateHeight(newHeight: number): void {
        this.maxHeight = newHeight;
        this.savePos('__updateHeight__');

        this.goTo(0, 0);
        let cnt = newHeight;
        while (cnt--) console.log('');
        this.y = newHeight;

        this.loadPos('__updateHeight__');
    }

    _positions = {};
    savePos(tag = null): void {
        tag = tag || '__tmp__';
        this._positions[tag] = {
            x: this.x,
            y: this.y,
        };
    }

    loadPos(tag = null): void {
        tag = tag || '__tmp__';
        if (!(tag in this._positions)) {
            throw new Error('Trying to load non saved position!');
        }
        const { x, y } = this._positions[tag];
        this.goTo(y, x);
    }

    up(n = 1): void {
        if (this.y - n <= 0) n = this.y;
        if (n === 0) return;
        if (n < 0) {
            this.down(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}A`);
        this.y -= n;
    }
    down(n = 1): void {
        if (this.y + n >= this.maxHeight) n = this.maxHeight - this.y;
        if (n === 0) return;
        if (n < 0) {
            this.up(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}B`);
        this.y += n;
    }
    right(n = 1): void {
        if (this.x + n >= this.maxWidth) n = this.maxWidth - this.x;
        if (n === 0) return;
        if (n < 0) {
            this.left(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}C`);
        this.x += n;
    }
    left(n = 1): void {
        if (this.x - n <= 0) n = this.x;
        if (n === 0) return;
        if (n < 0) {
            this.right(-1 * n);
            return;
        }
        process.stdout.write(`\x1b[${n}D`);
        this.x -= n;
    }

    goTo(y = this.y, x = this.x): void {
        this.sol();
        this.down(y - this.y);
        this.right(x - this.x);
    }

    goToLine(y = this.y): void {
        this.goTo(y, undefined);
    }

    goToCol(x = this.x): void {
        this.goTo(undefined, x);
    }

    /**
     * Puts the cursor to the start of line
     */
    sol(): void {
        process.stdout.write(`\x1b[1000D`);
        this.x = 0;
    }

    /**
     * Clears the whole screen and puts cursor on top
     */
    clearScreen(): void {
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
    clearLine(): void {
        this.sol();
        this.clearToEndOfLine();
    }

    clearToEndOfLine(): void {
        process.stdout.write('\x1b[K');
    }

    /**
     * writes a message to the screen
     */
    write(text: string, styleOpts: StyleOptions = {}): void {
        if (styleOpts && 'color' in styleOpts) this.color(styleOpts.color);
        if (styleOpts && 'bold' in styleOpts && styleOpts.bold) this.bold();
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

    testColors(): void {
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

    changeLine(y: number, str: string): void {
        this.goToLine(y);
        this.clearLine();
        this.write(str);
    }

    onKeyPress = ((key: Key) => {
        if (!this.hitListener) return;
        this.hitListener(key.key, key.ctrl, key.shift);
    }).bind(this);

    hitListener = null;
    onKeyHit(
        cb: (keyname: string, ctrl: boolean, shift: boolean) => unknown
    ): void {
        this.offHitKey();

        this.kb.onKeyPress(this.onKeyPress);
        this.hitListener = cb;
    }

    offHitKey(): void {
        this.kb.offKeyPress();
        this.hitListener = null;
    }
}

export { Cli };
