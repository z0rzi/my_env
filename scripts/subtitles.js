#!/bin/env node
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
import fs from 'fs';
import * as shell from './shell.js';
function findMovies(search) {
    return __awaiter(this, void 0, void 0, function* () {
        let year = 0;
        search = search.replace(/\d{4}/g, match => {
            year = +match;
            return '';
        });
        return fetch('https://www.opensubtitles.org/libs/suggest.php?format=json3&SubLanguageID=spa&MovieName=' +
            encodeURIComponent(search), { method: 'GET' })
            .then(res => res.json())
            .then(res => {
            if (!year)
                return res;
            return res.filter((meta) => +meta.year === year);
        });
    });
}
function scrapeMoviePage(movieId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(`https://www.opensubtitles.org/en/ssearch/sublanguageid-spa/idmovie-${movieId}`).then(res => res.text());
        const document = new HtmlNode(res);
        const links = [];
        try {
            const resTable = document.querySelector('#search_results')[0];
            const tableContent = resTable.children[0].children;
            let seasonNum = 0;
            for (const line of tableContent) {
                if (!('itemprop' in line.props)) {
                    // It's a season number
                    try {
                        /** Will look like 'season-2' */
                        const seasonName = line.querySelector('span')[0].innerText;
                        seasonNum = +seasonName.match(/\d+/g)[0];
                    }
                    catch (err) {
                        // console.log(
                        //     'Error while trying to find the season number...'
                        // );
                        seasonNum++;
                    }
                }
                else {
                    // It's an episode
                    const episode = line.querySelector('[itemprop=episodeNumber]')[0];
                    const episodeNum = +episode.innerText;
                    let papa = episode.parent;
                    const domLink = papa.querySelector('[itemprop=url]')[0];
                    if (!domLink) {
                        // No download available for this episode...
                        continue;
                    }
                    if (!(seasonNum in links))
                        links[seasonNum] = [];
                    links[seasonNum][episodeNum] =
                        'https://www.opensubtitles.org' + domLink.props['href'];
                }
            }
            return links;
        }
        catch (err) {
            console.log('Failed while scraping the web page ' + movieId);
            console.log(err);
        }
    });
}
function scrapeSubsList(link) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!link.startsWith('http')) {
            link = `https://www.opensubtitles.org/en/search/sublanguageid-spa/imdbid-${link}`;
        }
        const res = yield fetch(link).then(res => res.text());
        const document = new HtmlNode(res);
        const links = [];
        try {
            const allLinks = document.querySelector('a[href]');
            for (const domLink of allLinks) {
                const link = domLink.props['href'];
                if (/subtitleserve/.test(link)) {
                    links.push('https://www.opensubtitles.org' + link);
                }
            }
            return links;
        }
        catch (err) {
            console.log('Failed while scraping the web page ' + link);
            console.log(err);
        }
    });
}
function downloadSub(link) {
    return __awaiter(this, void 0, void 0, function* () {
        const buffer = yield fetch(link).then(res => res.buffer());
        const dir = createDir();
        fs.writeFileSync(dir + '/file.zip', buffer, {
            encoding: 'binary',
        });
        // await shell.sourceCmd(`unzip`, [`${dir}/file.zip`, `-d`, `${dir}/`]);
        yield shell.cmd(`unzip ${dir}/file.zip -d ${dir}/`);
        const files = fs.readdirSync(dir);
        for (const kid of files) {
            if (!kid.endsWith('.srt'))
                continue;
            const content = fs.readFileSync(dir + '/' + kid, {
                encoding: 'utf8',
            });
            const newPath = process.env['HOME'] +
                '/Downloads/' +
                kid.replace(/[^a-zA-Z0-9-_.]+/g, '_');
            fs.writeFileSync(newPath, content);
            return newPath;
        }
    });
}
function createDir() {
    const name = ((Math.random() * Math.pow(36, 5)) >> 0).toString(36);
    const path = '/tmp/' + name;
    if (fs.existsSync(path))
        return createDir();
    fs.mkdirSync(path);
    return path;
}
let season = 0, episode = 0;
const search = process.argv
    .slice(2)
    .join(' ')
    .replace(/s\d+e\d+/i, numbers => {
    [season, episode] = numbers.match(/\d+/g).map(Number);
    return '';
});
let isMovie = false;
if (season > 0 && episode > 0) {
    console.log(`Looking for a SERIE.`);
    isMovie = false;
}
else {
    console.log(`Looking for a MOVIE.`);
    isMovie = true;
}
findMovies(search).then((res) => __awaiter(void 0, void 0, void 0, function* () {
    res = res.filter(elem => (isMovie && elem.kind === 'movie') ||
        (!isMovie && elem.kind === 'tv'));
    if (!res || !res.length) {
        console.log('No subtitles matched your search...');
    }
    console.log(`\nResult found: '${res[0].name}' from ${res[0].year}`);
    if (!isMovie) {
        const links = yield scrapeMoviePage(res[0].id);
        const link = links[season][episode];
        console.log('\nEpisodes links found!');
        for (let se = 1; se < links.length; se++) {
            console.log('  season ' + se);
            for (let ep = 1; ep < links[se].length; ep++) {
                console.log('    episode ' + ep + ' : \t' + links[se][ep]);
            }
        }
        if (!link) {
            console.log('\nNo download link could be found...');
            console.log(`We found a serie ('${res[0].name}' ~ ${res[0].year}), but no downloads could be find for the specified episode.`);
            return;
        }
        console.log('\nLooking for the download links...');
        const dlLinks = yield scrapeSubsList(link);
        console.log('\nDownlaod links found!');
        for (let i = 0; i < dlLinks.length; i++) {
            console.log('  ' + dlLinks[i]);
        }
        console.log('\nDownloading the first subtitle...');
        const path = yield downloadSub(dlLinks[0]);
        console.log(`Subtitles saved at '${path}'`);
    }
    else {
        const dlLinks = yield scrapeSubsList(res[0].pic);
        const path = yield downloadSub(dlLinks[0]);
        console.log(`Subtitles saved at '${path}'`);
    }
}));
