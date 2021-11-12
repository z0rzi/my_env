String.prototype['wordAtPos'] = function (pos) {
    const text = this;
    if (text.length <= pos)
        return '';
    const match = text.match(new RegExp(`^.{${pos}}\\w*`, 'g'));
    if (!match) {
        // Not on a word...
        return '';
    }
    return match[0].replace(/^.*\W/, '');
};
export {};
//# sourceMappingURL=String.js.map