#!/bin/bun

import fetch, { Headers } from 'node-fetch';
import { Cli } from './cli.js';
import * as goodreads from './good-reads.js';
import { Prompt } from './prompt.js';

type ApiResponse = {
    title: string;
    title_long: string;
    image: string;
    publisher: string;
    date_published: string;
    synopsis: string;
    authors: string[];
    language: string;
    pages: string;
    isbn13: string;
    isbn: string;
};

export type BookInfos = {
    id?: string;
    title: string;
    year: string;
    description: string;
    author: string;
    source: string;
    imageUrl: string;
    length: string;
};

const headers = new Headers({
    Authorization: '47906_0b0bccc1fa56a3032c77169bcde3ed76',
    'Content-Type': 'application/json',
});

function parseBook(raw: ApiResponse): BookInfos {
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

export async function getBookInfos(searchStr: string): Promise<BookInfos> {
    if (/^\d+$/.test(searchStr)) {
        let res = (await fetch('https://api2.isbndb.com/book/' + searchStr, {
            headers,
        }).then(res => res.json())) as { book: ApiResponse };

        return parseBook(res.book);
    }

    let res = (await fetch(
        'https://api2.isbndb.com/books/' + searchStr + '?pageSize=100',
        { headers }
    ).then(res => res.json())) as { books: ApiResponse[] };

    const searchWords = searchStr.split(/\s+/).map(w => w.toLowerCase());

    const parsedBooks = res.books
        .filter(
            book =>
                searchWords.every(word => {
                    return (
                        book.title.toLowerCase().includes(word) ||
                        (book.authors &&
                            book.authors.some(author =>
                                author.toLowerCase().includes(word)
                            ))
                    );
                }) && book.language === 'en'
        )
        .map(parseBook)
        .sort((a, b) => {
            if (
                a.title.toLowerCase() === searchStr.toLowerCase() &&
                b.title.toLowerCase() !== searchStr.toLowerCase()
            )
                return -1;
            if (
                b.title.toLowerCase() === searchStr.toLowerCase() &&
                a.title.toLowerCase() !== searchStr.toLowerCase()
            )
                return 1;

            if (!a.description && !b.description) return 0;

            if (!b.description) return -1;
            if (!a.description) return 1;

            return b.description.length - a.description.length;
        });

    if (!parsedBooks.length) return goodreads.getBookInfos(searchStr);

    console.log(parsedBooks);

    return parsedBooks[0];
}

if (/isbn-db.js/.test(process.argv[1])) {
    (async () => {
        console.log(await getBookInfos(process.argv.slice(2).join(' ')));
    })();
}
