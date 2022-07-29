#!/bin/node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from 'node-fetch';
import { HtmlNode } from './html.js';
function getEmojis(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield fetch('https://emojipedia.org/search/?q=' + encodeURIComponent(query)).then(res => res.text());
        // console.log(res);
        const doc = new HtmlNode(res);
        console.log(doc.querySelector('ol.search-results')[0].children.map(kid => kid.innerText));
    });
}
getEmojis(process.argv[2]);
