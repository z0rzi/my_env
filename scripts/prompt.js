var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class Prompt {
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
    destroy() {
        this.cli.onKeyHit(this._oldKbListener);
    }
    redraw() {
        this.cli.toggleCursor(false);
        this.cli.goToLine(this.line);
        this.cli.savePos();
        this.cli.goToCol(this.col);
        this.cli.clearToEndOfLine();
        this.cli.write(this.value);
        this._lastValue = this.value;
        this.cli.loadPos();
        this.cli.toggleCursor(true);
    }
    promptInputListener(keyName, ctrl, shift, alt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.onKeyHit && !(yield this.onKeyHit(keyName, ctrl, shift, alt)))
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
                        if (this.onConfirm && (yield this.onConfirm(this.value)))
                            this.destroy();
                        break;
                    case 'escape':
                        if (this.onCancel && (yield this.onCancel(this.value)))
                            this.destroy();
                        break;
                }
            }
            if (this.onChange &&
                oldText !== this.value &&
                (yield this.onChange(this.value)))
                this.destroy();
        });
    }
}
