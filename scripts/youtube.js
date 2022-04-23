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
function getJsonAfter(raw, word) {
    const rx = new RegExp(`^[\\S\\s]*?${word}.*?{`, '');
    raw = raw.replace(rx, '{');
    let rawJson = '';
    let stack = 0;
    for (let i = 0; i < raw.length; i++) {
        const cara = raw[i];
        const lastCara = i > 0 ? raw[i - 1] : '';
        if (lastCara !== '\\') {
            if (cara === '{')
                stack++;
            if (cara === '}')
                stack--;
        }
        rawJson += cara;
        if (!stack)
            break;
    }
    try {
        return JSON.parse(rawJson);
    }
    catch (err) {
        console.log('Invalid JSON...');
        return;
    }
}
function search(searchStr) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield fetch('https://www.youtube.com/results?search_query=' +
            encodeURIComponent(searchStr), {
            headers: new Headers({
                cookie: 'PREF=tz=Europe.Paris&gl=US&hl=en',
            }),
        }).then(res => res.text());
        const parsedJson = getJsonAfter(res, 'estimatedResults":[^,]*,"contents');
        const out = [];
        for (const searchResult of parsedJson.twoColumnSearchResultsRenderer
            .primaryContents.sectionListRenderer.contents[0].itemSectionRenderer
            .contents) {
            if (!('videoRenderer' in searchResult))
                continue;
            try {
                out.push({
                    id: searchResult.videoRenderer.videoId,
                    title: searchResult.videoRenderer.title.runs[0].text,
                    views: searchResult.videoRenderer.shortViewCountText.simpleText,
                    year: searchResult.videoRenderer.publishedTimeText.simpleText,
                    length: searchResult.videoRenderer.lengthText.simpleText,
                    imageUrl: searchResult.videoRenderer.thumbnail.thumbnails[0].url,
                    source: 'https://www.youtube.com/watch?v=' +
                        searchResult.videoRenderer.videoId,
                });
            }
            catch (err) {
                continue;
            }
        }
        return out;
    });
}
function getVideoExtraInfos(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield fetch('https://www.youtube.com/watch?v=' + id, {
            headers: new Headers({
                cookie: 'PREF=tz=Europe.Paris&gl=US&hl=en',
            }),
        }).then(res => res.text());
        const descJson = getJsonAfter(res, 'videoDetails');
        const likesJson = getJsonAfter(res, 'toggleButtonRenderer');
        return {
            description: descJson.shortDescription,
            author: descJson.author,
            rating: likesJson.toggledText.accessibility.accessibilityData.label,
        };
    });
}
export function getVideoInfos(videoName) {
    return __awaiter(this, void 0, void 0, function* () {
        const basicInfos = yield search(videoName);
        return Object.assign(Object.assign({}, basicInfos[0]), yield getVideoExtraInfos(basicInfos[0].id));
    });
}
