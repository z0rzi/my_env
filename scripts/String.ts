declare global {
    interface String {
        /** Gives the word at this position in this string */
        wordAtPos: (pos: number) => string;
    }
}

String.prototype['wordAtPos'] = function (pos: number) {
    const text = this as string;
    if (text.length <= pos) return '';

    const match = text.match(new RegExp(`^.{${pos}}\\w*`, 'g'));

    if (!match) {
        // Not on a word...
        return '';
    }

    return match[0].replace(/^.*\W/, '');
};

export {};
