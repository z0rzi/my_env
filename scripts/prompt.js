export class Prompt {
    constructor(cli, line, col) {
        this.cli = null;
        this._value = '';
        this.line = 0;
        this.col = 0;
        this.onConfirm = null;
        this.onChange = null;
        this.onCancel = null;
        this.onKeyHit = null;
        this._oldKbListener = null;
        this._lastValue = '';
        this.cli = cli;
        this.line = line;
        this.col = col;
        this.cli.goTo(line, col);
        this.cli.clearToEndOfLine();
        this._oldKbListener = this.cli.hitListener;
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
            pos = 0;
        if (pos > this.value.length)
            pos = this.value.length;
        pos = pos + this.col;
        this.cli.goToCol(pos);
    }
    destroy() {
        this.cli.onKeyHit(this._oldKbListener);
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
    async promptInputListener(keyName, ctrl, shift, alt) {
        if (this.onKeyHit && !(await this.onKeyHit(keyName, ctrl, shift, alt)))
            return;
        if (keyName === 'space')
            keyName = ' ';
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
                    if (this.caretPos === 0)
                        break;
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
                    if (this.onConfirm && (await this.onConfirm(this.value)))
                        this.destroy();
                    break;
                case 'escape':
                    if (this.onCancel && (await this.onCancel(this.value)))
                        this.destroy();
                    break;
            }
        }
        if (this.onChange &&
            oldText !== this.value &&
            (await this.onChange(this.value)))
            this.destroy();
    }
}
//# sourceMappingURL=prompt.js.map