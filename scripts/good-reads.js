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
function getBookMeta(searchStr) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = (yield fetch(`https://www.goodreads.com/book/auto_complete?format=json&q=${searchStr}`).then(res => res.json()));
        return {
            imageUrl: res[0].imageUrl,
            bookUrl: res[0].bookUrl,
            title: res[0].title,
            numPages: res[0].numPages,
            avgRating: res[0].avgRating,
            author: res[0].author,
            descriptionUrl: res[0].description.fullContentUrl,
        };
    });
}
function scrapeGoodReads(link) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(link).then(res => res.text());
        const document = new HtmlNode(res);
        try {
            let description = '';
            try {
                description =
                    document.getNodeById('description').children[1].innerText;
            }
            catch (err) {
                description = document.getNodeById('description').innerText;
            }
            const details = document.getNodeById('details').innerText;
            const publishTextMatches = details.match(/\(first published .*?\)/g);
            let publishText = '';
            if (publishTextMatches)
                publishText = publishTextMatches[0];
            const imgUrl = document.getNodeById('coverImage').props['src'];
            return { publishText, description, imgUrl };
        }
        catch (err) {
            console.log('Failed while scraping the web page ' + link);
            console.log(err);
        }
    });
}
export function getBookInfos(bookName) {
    return __awaiter(this, void 0, void 0, function* () {
        const metas = yield getBookMeta(bookName);
        const extraInfos = yield scrapeGoodReads(metas.descriptionUrl);
        return {
            title: metas.title,
            year: extraInfos.publishText,
            description: extraInfos.description,
            author: metas.author.name,
            source: 'https://www.goodreads.com' + metas.bookUrl,
            imageUrl: extraInfos.imgUrl,
            length: metas.numPages + ' pages',
            rating: metas.avgRating + ' / 10',
        };
    });
}
