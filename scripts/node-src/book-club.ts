#!/bin/node

import fetch from 'node-fetch';
import { HtmlNode } from './html.js';
import fs from 'fs';
import { cmd } from './shell.js';

type BookMetas = {
    imageUrl: string;
    bookUrl: string;
    title: 'Lord of the Flies';
    numPages: 182;
    avgRating: string; // '3.69';
    author: {
        name: string;
        profileUrl: string;
    };
    description: {
        fullContentUrl: string; // book page
    };
};

async function getBookMeta(searchStr: string): Promise<BookMetas> {
    const res = await fetch(
        `https://www.goodreads.com/book/auto_complete?format=json&q=${searchStr}`
    ).then(res => res.json());

    return res[0] as BookMetas;
}

async function scrapeWebPage(link: string) {
    const res = await fetch(link).then(res => res.text());
    fs.writeFileSync('/tmp/_.html', res);

    const document = new HtmlNode(res);

    try {
        let description = '';
        try {
            description =
                document.getNodeById('description').children[1].innerText;
        } catch (err) {
            description = document.getNodeById('description').innerText;
        }

        const details = document.getNodeById('details').innerText;

        const publishText = details.match(/\(first published .*?\)/);

        const imgUrl = document.getNodeById('coverImage').props['src'];

        return { publishText, description, imgUrl };
    } catch (err) {
        console.log('Failed while scraping the web page ' + link);
        console.log(err);
    }
}

async function generateHtmlFor(bookName: string) {
    const metas = await getBookMeta(bookName);
    const extraInfos = await scrapeWebPage(metas.description.fullContentUrl);

    return `
        <div style="font-size: 15px; color: #333">
            <table>
                <tr>
                    <td>
                        <img style="max-width: 150px; max-height: 200px;" src="${extraInfos.imgUrl}">
                    </td>
                    <td style="padding-left: 20px">
                        <div style="margin-bottom: 30px">
                            <div style="font-size: 30px; font-weight: bold;">${metas.title}</div>
                            <div style="font-style: italic; color: #aaa">${extraInfos.publishText}</div>
                        </div>
                        <p>
                            By ${metas.author.name}<br/>
                            ${metas.numPages} pages
                        </p>
                    </td>
                </tr>
            </table>

            <p style="padding-top: 30px">
                ${extraInfos.description}
            </p>
        </div>
    `;
}

async function main() {
    const htmls = [] as string[];
    for (const book of process.argv.slice(2)) {
        htmls.push(await generateHtmlFor(book));
    }

    fs.rmSync('/tmp/book-club', { recursive: true, force: true });
    fs.mkdirSync('/tmp/book-club', { recursive: true });
    fs.writeFileSync(
        '/tmp/book-club/index.html',
        htmls.join('<hr style="margin: 30px; margin-bottom: 100px"/>')
    );

    console.log("Opening web page on 'http://localhost:8000'");
    cmd('brave http://localhost:8000 &');
    cmd('php -S localhost:8000 -t /tmp/book-club/');
}
main();
