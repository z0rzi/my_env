import { Cli } from './cli.js';

type PromptCallback = (typedText: string) => unknown;
export class Prompt {
    cli: Cli = null;

    _value = '';
    get value(): string {
        return this._value;
    }
    set value(val: string) {
        this._value = val;
        this.redraw();
    }

    get caretPos(): number {
        return this.cli.x - this.col;
    }
    set caretPos(pos: number) {
        if (pos < 0) pos = 0;
        if (pos > this.value.length) pos = this.value.length;
        pos = pos + this.col;
        this.cli.goToCol(pos);
    }

    line = 0;
    col = 0;

    onConfirm: PromptCallback = null;
    onChange: PromptCallback = null;
    onCancel: PromptCallback = null;

    constructor(cli: Cli, line: number, col: number) {
        this.cli = cli;
        this.line = line;
        this.col = col;
        this.cli.goTo(line, col);
        this.cli.clearToEndOfLine();
        this.cli.onKeyHit(this.promptInputListener.bind(this));
    }

    _lastValue = '';
    redraw() {
        this.cli.toggleCursor(false);
        this.cli.savePos();

        this.cli.goToCol(this.col);
        this.cli.clearToEndOfLine();
        this.cli.write(this.value);
        this._lastValue = this.value;

        this.cli.loadPos();
        this.cli.toggleCursor(true);
    }

    promptInputListener(keyName: string, ctrl: boolean, shift: boolean): void {
        if (keyName === 'space') keyName = ' ';
        const oldText = this.value;
        if (ctrl) {
            switch (keyName) {
                case 'a':
                    this.caretPos = 0;
                    break;

                case 'e':
                    this.caretPos = this.value.length;
                    break;

                case 'u':
                    this.value = this.value.slice(this.caretPos);
                    this.caretPos = 0;
                    break;

                case 'w':
                    const cutBit = this.value
                        .slice(0, this.caretPos)
                        .replace(/(?:^|\s)\S*$/, '');
                    this.value = cutBit + this.value.slice(this.caretPos);
                    this.caretPos = cutBit.length;
                    break;
            }
        } else if (keyName.length === 1) {
            if (shift) keyName = keyName.toUpperCase();
            this.value =
                this.value.slice(0, this.caretPos) +
                keyName +
                this.value.slice(this.caretPos);

            this.caretPos++;
        } else {
            switch (keyName) {
                case 'backspace':
                    if (this.caretPos === 0) break;
                    this.value =
                        this.value.slice(0, this.caretPos - 1) +
                        this.value.slice(this.caretPos, this.value.length);
                    this.caretPos--;
                    break;

                case 'delete':
                    this.value =
                        this.value.slice(0, this.caretPos) +
                        this.value.slice(this.caretPos + 1, this.value.length);
                    break;

                case 'left':
                    this.caretPos--;
                    break;

                case 'right':
                    this.caretPos++;
                    break;

                case 'return':
                    if (this.onConfirm) this.onConfirm(this.value);
                    break;

                case 'escape':
                    if (this.onCancel) this.onCancel(this.value);
                    break;
            }
        }
        if (this.onChange && oldText !== this.value) this.onChange(this.value);
    }
}
