#!/bin/bun

import fs from 'fs';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import http from 'http';
import path from 'path';
import { findMistakes, Mistake } from './correct.js';

const md = new MarkdownIt({
    html: true,
    breaks: true, // Convert '\n' in paragraphs into <br>
    linkify: true, // Autoconvert URL-like text to links
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(str, { language: lang }).value;
            } catch (__) {}
        }

        return ''; // use external default escaping
    },
});

const markdownFile = path.resolve(process.argv[2]);

const css = `
html {
    height: 100%;
}
html, body {
    font-family: sans;
    color: #000000bf;
    background: #f3f3f3;
    line-height: 1.67;
    tab-size: 4;
    text-rendering: auto;
}
body {
    padding: 50px;
}
h1 {
    font-size: 2em;
    margin: 0.67em 0;
}
h1, h2, h3, h4, h5, h6 {
    margin: 1.8em 0;
    line-height: 1.33;
}
h1:after, h2:after {
    content: "";
    display: block;
    position: relative;
    top: 0.33em;
    border-bottom: 1px solid #8080805477;
}
blockquote, dl, ol, p, pre, ul {
    margin: 1.2em 0;
}
body > *:first-child {
    margin-top: 0;
}
code {
    background-color: #0000000d;
    border-radius: 3px;
    padding: 2px 4px;
}
.mistake {
    display: inline;
    position: relative;
    border-bottom: 2px solid #d11818;
    cursor: pointer;
}
.mistake:hover .correction {
    opacity: 1;
    height: 100%;
    z-index: 10000;
}
.correction {
    height: 0;
    left: 0;
    top: 100%;
    opacity: 0;
    white-space: nowrap;
    position: absolute;
    background: #fff;
    padding: 5px 10px;
    box-shadow: 2px 2px 5px #0002;
    transition: .2s;
}
pre>code {
    background-color: #0000000d;
    display: block;
    padding: 0.5em;
    -webkit-text-size-adjust: none;
    overflow-x: auto;
    white-space: pre;
}
code, pre, samp {
    font-family: Roboto Mono,Lucida Sans Typewriter,Lucida Console,monaco,Courrier,monospace;
    font-size: .85em;
}
a {
    color: #0c93e4;
    text-decoration: underline;
    text-decoration-skip: ink;
}
.hljs{color:#24292e;background:#fff}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#d73a49}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#6f42c1}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#005cc5}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#032f62}.hljs-built_in,.hljs-symbol{color:#e36209}.hljs-code,.hljs-comment,.hljs-formula{color:#6a737d}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#22863a}.hljs-subst{color:#24292e}.hljs-section{color:#005cc5;font-weight:700}.hljs-bullet{color:#735c0f}.hljs-emphasis{color:#24292e;font-style:italic}.hljs-strong{color:#24292e;font-weight:700}.hljs-addition{color:#22863a;background-color:#f0fff4}.hljs-deletion{color:#b31d28;background-color:#ffeef0}
`;

const js = `
function testReload() {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", "/should-reload")
    xhr.send()

    xhr.onload = function() {
        if (xhr.status !== 200) return; 
        if (xhr.responseText === 'true')
            window.location.reload(true)
    }

    xhr.onerror = function() {
      console.log("Network error occurred")
    }
}
function scrollToFocus() {
    const element = document.querySelector('#focus-me');
    if (!element) return;
    console.log(element);
    const html = document.querySelector('html');
    const height = html.offsetHeight;
    const pos = element.offsetTop - height / 2;
    html.scrollTo({
        top: pos < 0 ? 0 : pos,
        behavior: 'smooth'
    })
}
function setupMistakeClick() {
    const mistakesDom = document.querySelectorAll('.mistake');
    mistakesDom.forEach(elem => {
        const correction = elem.children[0].innerText;
        elem.onclick = () => {
            const xhr = new XMLHttpRequest()
            xhr.open("GET", "/correct/" + elem.id)
            xhr.send()
        };
    });
}
setInterval(() => {
    testReload();
}, 500);
setTimeout(() => {
    setupMistakeClick();
    scrollToFocus();
}, 100);
`;

let serv: null|http.Server = null;
let html = '';
let mistakes = {} as Record<string, Mistake>;
let shouldReload = false;
let currentMdLine = 0;
let splittedMd = [] as string[];

let lastMdContent = [] as string[];
let lastMtime = new Date();
setInterval(() => {
    const stats = fs.statSync(markdownFile);
    const mtime = stats.mtime;
    if (+mtime === +lastMtime) return;

    lastMtime = mtime;
    onFileSave().catch(err => {
        console.log(err);
    });
}, 100);
console.log('Server hosted on "http://localhost:8080"');

async function pause(delay = 10) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

async function onFileSave() {
    let markdownContent = fs.readFileSync(markdownFile, { encoding: 'utf8' });

    // finding on which line the change happened
    splittedMd = markdownContent.split(/\n/g);
    const lineNr = splittedMd.findIndex(
        (lineContent, lineIdx) => lineContent !== lastMdContent[lineIdx]
    );
    lastMdContent = splittedMd;

    if (lineNr > 0) currentMdLine = lineNr;

    if (currentMdLine > 0) {
        const lineSave = splittedMd[currentMdLine];

        let line = splittedMd[currentMdLine];
        const errors = await findMistakes(line);
        errors.reverse().forEach(mistake => {
            let mistakeId = 0;
            while (mistakeId in mistakes) mistakeId++;
            mistakes[mistakeId] = mistake;

            const before = line.slice(0, mistake.from);
            const after = line.slice(mistake.to);
            line =
                before +
                `@${mistakeId}::${mistake.originalText}::${mistake.replacement}@` +
                after;
        });

        splittedMd[currentMdLine] = line + '@cursor@';
        markdownContent = splittedMd.join('\n');
        splittedMd[currentMdLine] = lineSave;
    }

    html = md.render(markdownContent);
    html = html.replace(/@\d+::.*?::.*?@/g, error => {
        const { groups } = error.match(
            /^@(?<id>\d+)::(?<mistake>.*?)::(?<fix>.*?)@$/
        )!;
        if (!groups) return error;
        return `<span class="mistake" id="${groups.id}">${groups['mistake']}<span class="correction">${groups['fix']}</span></span>`;
    });
    const splittedHtml = html.split('\n');
    const currentLine = splittedHtml.findIndex(line =>
        line.includes('@cursor@')
    );
    if (currentLine >= 0) {
        let line = splittedHtml[currentLine].replace('@cursor@', '');
        splittedHtml[currentLine] =
            line +
            '<div id="focus-me" style="position: absolute; visibility: none"></div>';
    }

    html = splittedHtml.join('\n');

    if (serv) serv.close();
    serv = http
        .createServer(function (req: http.IncomingMessage, res: http.ServerResponse) {
            const url = req.url!;
            if (url === '/should-reload') {
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify(shouldReload));
                shouldReload = false;
            } else if (url.startsWith('/correct')) {
                const id = +url.match(/\d+/)![0];
                const mistake = mistakes[id];
                const line = splittedMd[currentMdLine];
                const before = line.slice(0, mistake.from);
                const after = line.slice(mistake.to);
                splittedMd[currentMdLine] =
                    before + mistake.replacement + after;
                fs.writeFileSync(markdownFile, splittedMd.join('\n'));
                res.end('ok');
            } else if (/.png$/.test(url)) {
                let assetPath = url;
                if (!fs.existsSync(assetPath)) {
                    assetPath = path.join(
                        path.dirname(markdownFile),
                        assetPath
                    );
                }
                if (!fs.existsSync(assetPath)) {
                    return;
                }
                // absolute path
                let file: null | fs.ReadStream = null;
                file = fs.createReadStream(assetPath);
                res.setHeader('content-type', 'image/png');
                file.pipe(res);
            } else {
                res.setHeader('content-type', 'text/html');
                res.end(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width">
                            <title>${path.basename(markdownFile)}</title>
                            <link rel="canonical" href="https://nodejs.org/api/http.html">
                            <style>${css}</style>
                            <script>${js}</script>
                        </head>
                        <body>${html}</body>
                    </html>
                `);
            }
        })
        .listen(8080);
    shouldReload = true;
}
