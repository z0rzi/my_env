import fetch from 'node-fetch';
import { HtmlNode } from './html.js';

type RawBookMetas = {
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

type BookMetas = {
    imageUrl: string;
    bookUrl: string;
    title: string;
    numPages: number;
    avgRating: string; // '3.69';
    author: {
        name: string;
        profileUrl: string;
    };
    descriptionUrl: string;
};

export type BookInfos = {
    title: string;
    year: string;
    description: string;
    author: string;
    source: string;
    imageUrl: string;
    length: string;
    rating: string;
};

async function getBookMeta(searchStr: string): Promise<BookMetas> {
    const res = (await fetch(
        `https://www.goodreads.com/book/auto_complete?format=json&q=${searchStr}`
    ).then(res => res.json())) as RawBookMetas[];

    return {
        imageUrl: res[0].imageUrl,
        bookUrl: res[0].bookUrl,
        title: res[0].title,
        numPages: res[0].numPages,
        avgRating: res[0].avgRating, // '3.69',
        author: res[0].author,
        descriptionUrl: res[0].description.fullContentUrl,
    };
}

async function scrapeGoodReads(link: string) {
    const res = await fetch(link).then(res => res.text());

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

        const publishTextMatches = details.match(/\(first published .*?\)/g);
        let publishText = '';
        if (publishTextMatches) publishText = publishTextMatches[0];

        const imgUrl = document.getNodeById('coverImage').props['src'];

        return { publishText, description, imgUrl };
    } catch (err) {
        console.log('Failed while scraping the web page ' + link);
        console.log(err);
    }
}

export async function getBookInfos(bookName: string): Promise<BookInfos> {
    const metas = await getBookMeta(bookName);
    const extraInfos = await scrapeGoodReads(metas.descriptionUrl);

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
}
