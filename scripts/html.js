const specialCharacs = {
    '&gt;': '>',
    '&lt;': '<',
    '&nbsp;': ' ',
    '&#x27;': "'",
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&ecirc;': 'ê',
    '&euml;': 'ë',
    '&aacute;': 'á',
    '&agrave;': 'à',
    '&acirc;': 'â',
    '&auml;': 'ä',
    '&uacute;': 'ú',
    '&ugrave;': 'ù',
    '&ucirc;': 'û',
    '&uuml;': 'ü',
};
export class HtmlNode {
    constructor(rawHtml, firstTime = true) {
        this.children = [];
        this.selfClosing = false;
        this.text = '';
        this.tag = '';
        this.props = {};
        this.id = '';
        this.classes = [];
        this._opening_tag_length = 0;
        this._closing_tag_length = 0;
        this._content_length = 0;
        if (firstTime) {
            rawHtml = rawHtml
                .trim()
                .replace(/\n/g, '')
                .replace(/<script[^>]*>.*?<\/script>/g, '')
                .replace(/<script.*?\/>/g, '')
                .replace(/<\/script>/g, '')
                .replace(/<noscript[^>]*>.*?<\/noscript>/g, '')
                .replace(/<noscript.*?\/>/g, '')
                .replace(/<\/noscript>/g, '')
                .replace(/<\/(?:br|hr)>/g, '')
                .replace(/<!--.*?-->/g, '')
                .replace(/<[^a-zA-Z]{2}.*?>/g, '')
                .replace(/^<!doctype.*?>/gi, '');
        }
        if (rawHtml.charAt(0) !== '<') {
            this.text = rawHtml.match(/^[^<]*/g)[0];
            this._content_length = this.text.length;
            return;
        }
        let matches = rawHtml.match(/^<(?<tag>\w+\b)(?<props>[^>]*?)(?<selfClosing>\/?)\s*>(?<content>[\s\S]*)$/);
        let tag, props, selfClosing, content;
        try {
            tag = matches.groups.tag;
            props = matches.groups.props;
            selfClosing = matches.groups.selfClosing;
            content = matches.groups.content;
        }
        catch (err) {
            console.log(err);
            console.error('That does not look like html 🙁 - ' + rawHtml.slice(0, 50));
            rawHtml = rawHtml.replace(/^..*<\/?([a-zA-Z])/, '<$1');
            console.log(rawHtml.slice(0, 50));
            matches = rawHtml.match(/^<(?<tag>\w+\b)(?<props>[^>]*?)(?<selfClosing>\/?)\s*>(?<content>.*)$/);
            tag = matches.groups.tag;
            props = matches.groups.props;
            selfClosing = matches.groups.selfClosing;
            content = matches.groups.content;
        }
        this._opening_tag_length = rawHtml.length - content.length;
        this.tag = tag;
        this.selfClosing = !!selfClosing;
        if (/^(?:meta|link|br|hr|img)$/i.test(tag))
            this.selfClosing = true;
        this.parseProps(props);
        this.innerHTML = content;
        if (firstTime)
            this.removeWhiteTextNodes();
    }
    get _total_length() {
        return (this._opening_tag_length +
            this._content_length +
            this._closing_tag_length);
    }
    isTextNode() {
        return !!this.text;
    }
    removeWhiteTextNodes() {
        let idx = this.children.length;
        while (idx--) {
            if (this.children[idx].isTextNode() &&
                !this.children[idx].text.trim().length) {
                this.children.splice(idx, 1);
            }
            else {
                this.children[idx].removeWhiteTextNodes();
            }
        }
    }
    parseProps(rawProps) {
        this.props = {};
        const rawList = rawProps.match(/(?<key>\S+)=(?<value>"[^"]*"|'[^']*'|\d*)/g);
        if (!rawList)
            return;
        rawList.forEach(rawProp => {
            const matches = rawProp.match(/^(?<key>\S+)=(?<value>".*"|'.*'|\d*)$/);
            try {
                let { key, value } = matches.groups;
                value = value.replace(/^['"]|['"]$/g, '');
                this.props[key] = value;
                if (key === 'id')
                    this.id = value;
                if (key === 'class')
                    this.classes = value.trim().split(/\s+/g);
            }
            catch (err) {
                return;
            }
        });
    }
    get outerHTML() {
        if (this.isTextNode())
            return this.text;
        const arrayProps = [];
        Object.entries(this.props).forEach(([key, val]) => {
            arrayProps.push(`${key}="${val}"`);
        });
        return `<${this.tag}${arrayProps.length ? ' ' + arrayProps.join(' ') : ''}${this.selfClosing ? '/>' : `>${this.innerHTML}</${this.tag}>`}`;
    }
    get innerHTML() {
        if (this.isTextNode())
            return this.text;
        return this.children.map(kid => kid.outerHTML).join('');
    }
    set innerHTML(rawContent) {
        if (this.selfClosing) {
            // no content...
            // this._content_length = this._init_html_length - rawContent.length;
            return;
        }
        this.children = [];
        let cnt = 1000;
        const initialLength = rawContent.length;
        while (cnt--) {
            // looking for closing tag
            const matches = rawContent.match(/^<\/(?<tag>\w+)>/);
            if (!!matches) {
                const { tag } = matches.groups;
                if (tag !== this.tag) {
                    throw new Error('Tags are not matching!\n' +
                        `Was expecting '${this.tag}' but got '${tag}'`);
                }
                this._content_length = initialLength - rawContent.length;
                const lengthBeforeCut = rawContent.length;
                rawContent = rawContent.replace(/^<\/\w+>/, '');
                this._closing_tag_length = lengthBeforeCut - rawContent.length;
                break;
            }
            const kid = new HtmlNode(rawContent, false);
            rawContent = rawContent.slice(kid._total_length);
            this.children.push(kid);
        }
    }
    get innerText() {
        if (this.isTextNode()) {
            this.decodeSpecial();
            return this.text;
        }
        if (this.tag === 'br')
            return '\n';
        return this.children.map(kid => kid.innerText).join('');
    }
    toString() {
        if (this.isTextNode())
            return `"${this.text}"`;
        let out = this.tag;
        if ('id' in this.props)
            out += '#' + this.props['id'];
        if (this.children.length) {
            out += ' {\n  ';
            out += this.children
                .map(kid => kid.toString().replace(/\n/g, '\n  '))
                .join(', \n  ');
            out += '\n}';
        }
        return out;
    }
    getNodeById(id) {
        if (this.isTextNode())
            return null;
        if (this.id === id)
            return this;
        for (const kid of this.children) {
            const res = kid.getNodeById(id);
            if (res)
                return res;
        }
        return null;
    }
    getNodesByClass(classs) {
        if (this.isTextNode())
            return null;
        const kids = [];
        if (this.classes.includes(classs))
            kids.push(this);
        for (const kid of this.children) {
            const res = kid.getNodesByClass(classs);
            if (res)
                kids.push(...res);
        }
        return kids;
    }
    getNodesByProps(props) {
        if (this.isTextNode())
            return null;
        const kids = [];
        Object.entries(props).forEach(([key, value]) => {
            if (key in this.props && (!value || this.props[key] === value))
                kids.push(this);
        });
        for (const kid of this.children) {
            const res = kid.getNodesByProps(props);
            if (res)
                kids.push(...res);
        }
        return kids;
    }
    getNodesByAll({ tag, id, classes, props, }) {
        if (this.isTextNode())
            return [];
        const kids = [];
        let ok = true;
        if (tag && this.tag !== tag)
            ok = false;
        if (ok && props) {
            Object.entries(props).forEach(([key, value]) => {
                console.log(key, value);
                if (!(key in this.props) ||
                    (value && this.props[key] !== value))
                    ok = false;
            });
        }
        if (ok && classes) {
            for (const clas of classes) {
                if (!this.classes.includes(clas))
                    ok = false;
            }
        }
        if (ok && id) {
            if (this.id !== id)
                ok = false;
        }
        if (ok)
            kids.push(this);
        for (const kid of this.children) {
            const res = kid.getNodesByAll({ tag, id, classes, props });
            if (res)
                kids.push(...res);
        }
        return kids;
    }
    parseSelector(raw) {
        let tag = '', id = '';
        const classes = [], props = {};
        raw.replace(/#[^.#\[\]]+/g, match => {
            id = match.slice(1);
            return '';
        })
            .replace(/\.[^.#\[\]]+/g, match => {
            classes.push(match.slice(1));
            return '';
        })
            .replace(/\[.*?\]/g, match => {
            match = match.slice(1, match.length - 1);
            const [key, value] = match.split('=');
            props[key] = value;
            return '';
        })
            .replace(/^[a-zA-Z]+/, match => {
            tag = match;
            return '';
        });
        return { tag, id, classes, props };
    }
    querySelector(selector) {
        if (!selector.length)
            return [this];
        const selectors = selector.split(/\s+/g);
        const requirements = this.parseSelector(selectors[0]);
        console.log(requirements);
        const kids = this.getNodesByAll(requirements);
        console.log(kids);
        const out = [];
        kids.forEach(kid => {
            out.push(...kid.querySelector(selectors.slice(1).join(' ')));
        });
        return out;
    }
    decodeSpecial() {
        if (!this.isTextNode()) {
            this.children.forEach(kid => kid.decodeSpecial());
            return;
        }
        Object.entries(specialCharacs).forEach(([code, cara]) => {
            this.text = this.text.replace(new RegExp(code, 'g'), cara);
        });
    }
}
