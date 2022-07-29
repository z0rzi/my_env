#!/bin/node

import fetch, { Headers } from 'node-fetch';
import { HtmlNode } from './html.js';

async function getEmojis(query) {
    let res = await fetch(
        'https://emojipedia.org/search/?q=' + encodeURIComponent(query)
    ).then(res => res.text());

    // console.log(res);

    const doc = new HtmlNode(res);

    console.log(
        doc.querySelector('ol.search-results')[0].children.map(kid => kid.innerText)
    );
}

getEmojis(process.argv[2]);
