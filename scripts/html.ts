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

/** Tags which might not be closed */
const unclosingTags = ['input', 'img', 'li'];

export type NodeObject =
    | string
    | {
          tag: string;
          props?: Record<string, string>;
          children?: NodeObject[];
      };

export class HtmlNode {
    parent?: HtmlNode;
    children: HtmlNode[] = [];
    selfClosing = false;
    text = '';
    tag = '';
    props = {} as Record<string, string>;
    id = '';
    classes: string[] = [];

    _opening_tag_length = 0;
    _closing_tag_length = 0;
    /** The size of the innerHTML */
    _content_length = 0;
    get _total_length(): number {
        return (
            this._opening_tag_length +
            this._content_length +
            this._closing_tag_length
        );
    }

    constructor(rawHtml: string, firstTime = true) {
        if (firstTime) {
            rawHtml = rawHtml
                .trim()
                .replace(/[\r\n]+/gm, '')
                .replace(/<script.*?>.*?<\/script>/g, '')
                .replace(/<script.*?\/>/g, '')
                .replace(/<\/script>/g, '')
                .replace(/<noscript[^>]*>.*?<\/noscript>/g, '')
                .replace(/<noscript.*?\/>/g, '')
                .replace(/<\/noscript>/g, '')
                .replace(/<\/(?:br|hr)>/g, '')
                .replace(/<!--.*?-->/g, '')
                .replace(/<[^a-zA-Z]{2}.*?>/g, '')
                .replace(/^<!doctype.*?>/gi, '')
                .replace(/^<\?.*?\?>/gi, '');
        }

        if (rawHtml.charAt(0) !== '<') {
            this.text = rawHtml.match(/^[^<]*/g)![0];
            this._content_length = this.text.length;
            return;
        }

        let matches = rawHtml.match(
            /^<(?<tag>\w+\b)(?<props>[^>]*?)(?<selfClosing>\/?)\s*>(?<content>[\s\S]*)$/
        );

        let tag: string, props: string, selfClosing: string, content: string;

        const matchGroup = matches!.groups!;

        try {
            tag = matchGroup.tag;
            props = matchGroup.props;
            selfClosing = matchGroup.selfClosing;
            content = matchGroup.content;
        } catch (err) {
            console.log(err);
            console.error(
                'That does not look like html 🙁 - ' + rawHtml.slice(0, 50)
            );
            rawHtml = rawHtml.replace(/^..*<\/?([a-zA-Z])/, '<$1');
            console.log(rawHtml.slice(0, 50));
            matches = rawHtml.match(
                /^<(?<tag>\w+\b)(?<props>[^>]*?)(?<selfClosing>\/?)\s*>(?<content>.*)$/
            );

            tag = matchGroup.tag;
            props = matchGroup.props;
            selfClosing = matchGroup.selfClosing;
            content = matchGroup.content;
        }

        this._opening_tag_length = rawHtml.length - content.length;
        this.tag = tag;
        this.selfClosing = !!selfClosing;
        if (/^(?:meta|br|hr|img)$/i.test(tag)) this.selfClosing = true;
        this.parseProps(props);
        this.innerHTML = content;

        if (firstTime) this.removeWhiteTextNodes();
    }

    isTextNode() {
        return !!this.text;
    }

    removeWhiteTextNodes() {
        let idx = this.children.length;
        while (idx--) {
            if (
                this.children[idx].isTextNode() &&
                !this.children[idx].text.trim().length
            ) {
                this.children.splice(idx, 1);
            } else {
                this.children[idx].removeWhiteTextNodes();
            }
        }
    }

    private parseProps(rawProps: string) {
        this.props = {};

        const rawList = rawProps.match(
            /(?<key>\S+)=(?<value>"[^"]*"|'[^']*'|\d*)/g
        );
        if (!rawList) return;

        rawList.forEach(rawProp => {
            const matches = rawProp.match(
                /^(?<key>\S+)=(?<value>".*"|'.*'|\d*)$/
            );
            try {
                let { key, value } = matches!.groups!;
                value = value.replace(/^['"]|['"]$/g, '');
                this.props[key] = value;
                if (key === 'id') this.id = value;
                if (key === 'class') this.classes = value.trim().split(/\s+/g);
            } catch (err) {
                return;
            }
        });
    }

    get outerHTML(): string {
        if (this.isTextNode()) return this.text;

        const arrayProps = [] as string[];
        Object.entries(this.props).forEach(([key, val]) => {
            arrayProps.push(`${key}="${val}"`);
        });
        return `<${this.tag}${
            arrayProps.length ? ' ' + arrayProps.join(' ') : ''
        }${this.selfClosing ? '/>' : `>${this.innerHTML}</${this.tag}>`}`;
    }

    get innerHTML(): string {
        if (this.isTextNode()) return this.text;

        return this.children.map(kid => kid.outerHTML).join('');
    }

    set innerHTML(rawContent: string) {
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
                const { tag } = matches.groups!;
                if (tag !== this.tag) {
                    // We met a closing tag, but it's not the one we expected
                    if (unclosingTags.includes(this.tag)) {
                        this._content_length =
                            initialLength - rawContent.length;
                        this._closing_tag_length = 0;

                        break;
                    } else {
                        throw new Error(
                            'Tags are not matching!\n' +
                                `Was expecting '${this.tag}' but got '${tag}'`
                        );
                    }
                }

                this._content_length = initialLength - rawContent.length;

                const lengthBeforeCut = rawContent.length;
                rawContent = rawContent.replace(/^<\/\w+>/, '');

                this._closing_tag_length = lengthBeforeCut - rawContent.length;

                break;
            }

            const kid = new HtmlNode(rawContent, false);
            kid.parent = this;
            rawContent = rawContent.slice(kid._total_length);
            this.children.push(kid);
        }
    }

    get innerText(): string {
        if (this.isTextNode()) {
            this.decodeSpecial();
            return this.text;
        }
        if (this.tag === 'br') return '\n';
        return this.children.map(kid => kid.innerText).join('');
    }

    toString(): string {
        if (this.isTextNode()) return `"${this.text}"`;
        let out = this.tag;
        if ('id' in this.props) out += '#' + this.props['id'];

        if (this.children.length) {
            out += ' {\n  ';
            out += this.children
                .map(kid => kid.toString().replace(/\n/g, '\n  '))
                .join(', \n  ');
            out += '\n}';
        }

        return out;
    }

    toObject(): NodeObject {
        if (this.isTextNode()) return `"${this.text}"`;
        let out: NodeObject = {
            tag: this.tag,
        };

        if (this.props && Object.keys(this.props).length) {
            out.props = this.props;
        }

        if (this.children.length)
            out.children = this.children.map(kid => kid.toObject());

        return out;
    }

    static fromObject(obj: NodeObject): HtmlNode {
        if (typeof obj === 'string') return new HtmlNode(obj);
        const papa = new HtmlNode('');
        papa.selfClosing = false;
        papa.text = '';
        papa.tag = obj.tag;
        papa.props = obj.props || {};
        if (obj.children) {
            papa.children = obj.children.map(kid => HtmlNode.fromObject(kid))
        }
        return papa;
    }

    toHTML(): string {
        if (this.isTextNode()) return this.text;
        let out = `<${this.tag}`;
        let strProps = [] as string[];

        Object.entries(this.props).forEach(([key, val]) => {
            strProps.push(`${key}="${val.replace(/"/g, '\\"')}"`);
        });
        if (strProps.length) out += ' ' + strProps.join(' ');

        if (this.selfClosing) out += '/';
        out += '>';

        if (this.children.length === 1 && this.children[0].isTextNode()) {
            out += this.children[0].text;
        } else {
            out += '\n';

            if (this.children.length) {
                out += ' ';
                out += this.children
                    .map(kid => {
                        let htmlKid = kid.toHTML();
                        return htmlKid.replace(/\n/g, '\n  ')
                    })
                    .join('\n  ');
                out += '\n';
            }
        }

        if (!this.selfClosing) out += `</${this.tag}>`;

        return out;
    }

    getNodeById(id: string): HtmlNode | null {
        if (this.isTextNode()) return null;
        if (this.id === id) return this;

        for (const kid of this.children) {
            const res = kid.getNodeById(id);
            if (res) return res;
        }

        return null;
    }

    getNodesByClass(classs: string): null | HtmlNode[] {
        if (this.isTextNode()) return null;
        const kids = [];

        if (this.classes.includes(classs)) kids.push(this);

        for (const kid of this.children) {
            const res = kid.getNodesByClass(classs);
            if (res) kids.push(...res);
        }

        return kids;
    }

    getNodesByProps(props: { [key: string]: string }): null | HtmlNode[] {
        if (this.isTextNode()) return null;
        const kids = [];

        Object.entries(props).forEach(([key, value]) => {
            if (key in this.props && (!value || this.props[key] === value))
                kids.push(this);
        });

        for (const kid of this.children) {
            const res = kid.getNodesByProps(props);
            if (res) kids.push(...res);
        }

        return kids;
    }

    getNodesByAll({
        tag,
        id,
        classes,
        props,
    }: {
        tag: string;
        id: string;
        classes: string[];
        props: { [key: string]: string };
    }): HtmlNode[] {
        if (this.isTextNode()) return [];
        const kids = [];

        let ok = true;
        if (tag && this.tag !== tag) ok = false;
        if (ok && props) {
            Object.entries(props).forEach(([key, value]) => {
                if (
                    !(key in this.props) ||
                    (value && this.props[key] !== value)
                )
                    ok = false;
            });
        }
        if (ok && classes) {
            for (const clas of classes) {
                if (!this.classes.includes(clas)) ok = false;
            }
        }
        if (ok && id) {
            if (this.id !== id) ok = false;
        }

        if (ok) kids.push(this);

        for (const kid of this.children) {
            const res = kid.getNodesByAll({ tag, id, classes, props });
            if (res) kids.push(...res);
        }

        return kids;
    }

    parseSelector(raw: string): {
        tag: string;
        id: string;
        classes: string[];
        props: { [prop: string]: string };
    } {
        let tag = '',
            id = '';
        const classes: string[] = [],
            props: Record<string, string> = {};

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

    querySelector(selector: string): HtmlNode[] {
        if (!selector.length) return [this];
        const selectors = selector.split(/\s+/g);

        const requirements = this.parseSelector(selectors[0]);

        const kids = this.getNodesByAll(requirements);

        const out = [] as HtmlNode[];

        kids.forEach(kid => {
            out.push(...kid.querySelector(selectors.slice(1).join(' ')));
        });

        return out;
    }

    decodeSpecial(): void {
        if (!this.isTextNode()) {
            this.children.forEach(kid => kid.decodeSpecial());
            return;
        }

        Object.entries(specialCharacs).forEach(([code, cara]) => {
            this.text = this.text.replace(new RegExp(code, 'g'), cara);
        });
    }
}
