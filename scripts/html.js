const specialCharacs = {
    '&eacute;': 'é', '&egrave;': 'è', '&ecirc;': 'ê', '&euml;': 'ë',
    '&aacute;': 'á', '&agrave;': 'à', '&acirc;': 'â', '&auml;': 'ä',
    '&uacute;': 'ú', '&ugrave;': 'ù', '&ucirc;': 'û', '&uuml;': 'ü',
};
export class HtmlNode {
    constructor(rawHtml) {
        this.children = [];
        this.selfClosing = false;
        this.text = '';
        this.tag = '';
        this.props = {};
        this.id = '';
        this._opening_tag_length = 0;
        this._closing_tag_length = 0;
        this._content_length = 0;
        if (rawHtml.charAt(0) !== '<') {
            this.text = rawHtml.match(/^.*?(?=<|$)/g)[0];
            this._content_length = this.text.length;
            return;
        }
        const matches = rawHtml.match(/^<(?<tag>\w+\b)(?<props>[^>]*?)(?<selfClosing>\/?)\s*>(?<content>.*)$/);
        let tag, props, selfClosing, content;
        try {
            tag = matches.groups.tag;
            props = matches.groups.props;
            selfClosing = matches.groups.selfClosing;
            content = matches.groups.content;
        }
        catch (err) {
            throw new Error('That does not look like html 🙁 - ' + rawHtml);
        }
        this._opening_tag_length = rawHtml.length - content.length;
        this.tag = tag;
        this.selfClosing = !!selfClosing;
        this.parseProps(props);
        this.innerHTML = content;
    }
    get _total_length() {
        return this._opening_tag_length + this._content_length + this._closing_tag_length;
    }
    isTextNode() {
        return !!this.text;
    }
    parseProps(rawProps) {
        this.props = {};
        const rawList = rawProps.match(/(?<key>\w+)=(?<value>"[^"]*"|'[^']*'|\d*)/g);
        if (!rawList)
            return;
        rawList.forEach(rawProp => {
            const matches = rawProp.match(/^(?<key>\w+)=(?<value>".*"|'.*'|\d*)$/);
            try {
                let { key, value } = matches.groups;
                value = value.replace(/^['"]|['"]$/g, '');
                this.props[key] = value;
                if (key === 'id')
                    this.id = value;
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
        let cnt = 100;
        const initialLength = rawContent.length;
        while (cnt--) {
            const kid = new HtmlNode(rawContent);
            rawContent = rawContent.slice(kid._total_length);
            this.children.push(kid);
            // looking for closing tag
            const matches = rawContent.match(/^<\/(?<tag>\w+)>/);
            if (!!matches) {
                const { tag } = matches.groups;
                if (tag !== this.tag)
                    throw new Error('Tags are not matching!');
                this._content_length = initialLength - rawContent.length;
                let lengthBeforeCut = rawContent.length;
                rawContent = rawContent.replace(/^<\/\w+>/, '');
                this._closing_tag_length = lengthBeforeCut - rawContent.length;
                break;
            }
        }
    }
    get innerText() {
        if (this.isTextNode())
            return this.text;
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
            out += this.children.map(kid => kid.toString().replace(/\n/g, '\n  '))
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
//# sourceMappingURL=html.js.map