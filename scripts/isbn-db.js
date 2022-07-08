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
import fetch, { Headers } from 'node-fetch';
import * as goodreads from './good-reads.js';
const headers = new Headers({
    Authorization: '47906_0b0bccc1fa56a3032c77169bcde3ed76',
    'Content-Type': 'application/json',
});
function parseBook(raw) {
    return {
        id: raw.isbn,
        title: raw.title,
        year: raw.date_published,
        description: raw.synopsis,
        author: raw.authors.join(', '),
        source: '',
        imageUrl: raw.image,
        length: raw.pages,
    };
}
export function getBookInfos(searchStr) {
    return __awaiter(this, void 0, void 0, function* () {
        if (/^\d+$/.test(searchStr)) {
            let res = (yield fetch('https://api2.isbndb.com/book/' + searchStr, {
                headers,
            }).then(res => res.json()));
            return parseBook(res.book);
        }
        let res = (yield fetch('https://api2.isbndb.com/books/' + searchStr + '?pageSize=100', { headers }).then(res => res.json()));
        const searchWords = searchStr.split(/\s+/).map(w => w.toLowerCase());
        const parsedBooks = res.books
            .filter(book => searchWords.every(word => {
            return (book.title.toLowerCase().includes(word) ||
                (book.authors &&
                    book.authors.some(author => author.toLowerCase().includes(word))));
        }) && book.language === 'en')
            .map(parseBook)
            .sort((a, b) => {
            if (a.title.toLowerCase() === searchStr.toLowerCase() &&
                b.title.toLowerCase() !== searchStr.toLowerCase())
                return -1;
            if (b.title.toLowerCase() === searchStr.toLowerCase() &&
                a.title.toLowerCase() !== searchStr.toLowerCase())
                return 1;
            if (!a.description && !b.description)
                return 0;
            if (!b.description)
                return -1;
            if (!a.description)
                return 1;
            return b.description.length - a.description.length;
        });
        if (!parsedBooks.length)
            return goodreads.getBookInfos(searchStr);
        console.log(parsedBooks);
        return parsedBooks[0];
    });
}
if (/isbn-db.js/.test(process.argv[1])) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        console.log(yield getBookInfos(process.argv.slice(2).join(' ')));
    }))();
}
