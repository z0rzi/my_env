export class Prompt {
    constructor(cli, line, col) {
        this.cli = null;
        this._value = '';
        this.line = 0;
        this.col = 0;
        this.onConfirm = null;
        this.onChange = null;
        this.onCancel = null;
        this._lastValue = '';
        this.cli = cli;
        this.line = line;
        this.col = col;
        this.cli.goTo(line, col);
        this.cli.clearToEndOfLine();
        this.cli.onKeyHit(this.promptInputListener.bind(this));
    }
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = val;
        this.redraw();
    }
    get caretPos() {
        return this.cli.x - this.col;
    }
    set caretPos(pos) {
        if (pos < 0)
            return;
        pos = pos + this.col;
        this.cli.goToCol(pos);
    }
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
    promptInputListener(keyName, ctrl, shift) {
        if (keyName === 'space')
            keyName = ' ';
        this.cli.goTo(this.line, this.col + this.caretPos);
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
        }
        else if (keyName.length === 1) {
            if (shift)
                keyName = keyName.toUpperCase();
            this.value =
                this.value.slice(0, this.caretPos) +
                    keyName +
                    this.value.slice(this.caretPos);
            this.caretPos++;
        }
        else {
            switch (keyName) {
                case 'backspace':
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
                    this.cli.left();
                    break;
                case 'right':
                    if (this.caretPos >= this.value.length)
                        break;
                    this.cli.right();
                    break;
                case 'return':
                    break;
                case 'escape':
                    break;
            }
        }
        // this.caretPos = this.cli.x - this.col;
        // if (this.value !== oldText && ) {};
    }
}
//# sourceMappingURL=Prompt.js.map