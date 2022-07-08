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
import fs from 'fs';
import { cmd } from './shell.js';
import { getBookInfos } from './isbn-db.js';
import { getMovieInfos } from './tmdb.js';
import { getVideoInfos } from './youtube.js';
const COLORS = {
    // brown: '#6F532A',
    // red: '#EB6361',
    // blue: '#3D8EB9',
    // green: '#24b555',
    // purple: '#897FBA',
    article: '#897FBA',
    podcast: '#24b555',
    book: '#6F532A',
    youtube: '#EB6361',
    movie: '#3D8EB9',
};
function generateHtmlFor(infos) {
    return `
        <div style="font-size: 15px; color: #333; font-family: sans-serif;">
            <table>
                <tr>
                    <td style="width: 1px">
                        <img style="max-width: 150px; max-height: 200px;" src="${infos.imageUrl}">
                    </td>
                    <td style="padding-left: 20px">
                        <div style="text-align: right">
                          <strong>
                              <span
                                class="size"
                                style="background-color: ${COLORS[infos.type]}; color: white; font-family: monospace; font-size: 11px; margin-bottom: 20px; padding: 1px 5px;"
                                >
                                    ${infos.type}
                                </span
                              >
                          </strong>
                        </div>
                        <div style="margin-bottom: 30px">
                            <div style="font-size: 30px; font-weight: bold;">
                                ${infos.title}
                            </div>
                            <div> ${infos.subtitle || ''} </div>
                            <div>
                                <span style="font-style: italic; color: #aaa">
                                    ${infos.year}
                                </span>
                            </div>
                            <a href="${infos.source}" target="_blank">🔗</a>
                        </div>
                        <p>
                            By ${infos.author}<br/>
                            ${infos.length}
                        </p>
                    </td>
                </tr>
                <tr>
                    <td colspan=2>
                        <div style="padding-top: 30px">
                            ${infos.description.replace(/\n/g, '<br />').replace(/[-_―]{3,}/g, '<hr style="margin: 30px 60px"/>')}
                        </div>
                    </td>
                </tr>
            </table>

        </div>
        <br />
    `;
}
function createExampleFile(filePath) {
    const example = '[\n\t["book", "Animal Farm"],\n\t["movie", "Scott Pilgrim"],\n\t["youtube", "Tim Ferris Interview"],\n\t{\n\t\t"type": "podcast",\n\t\t"title": "",\n\t\t"year": "",\n\t\t"description": "",\n\t\t"author": "",\n\t\t"source": "",\n\t\t"imageUrl": "",\n\t\t"length": "",\n\t\t"rating": ""\n\t}\n]';
    fs.writeFileSync(filePath, example);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        let filePath = '/tmp/book-club.json';
        while (args.length) {
            const arg = args.shift();
            if (!arg.endsWith('.json'))
                continue;
            filePath = arg;
        }
        if (!fs.existsSync(filePath))
            createExampleFile(filePath);
        yield cmd('kitty --title floating -o remember_window_size=no -o initial_window_height=800 -o initial_window_width=1500 nvim ' +
            filePath).catch(() => { });
        let fileContent = [];
        try {
            fileContent = JSON.parse(fs.readFileSync(filePath).toString());
        }
        catch (err) {
            console.log('Wrong JSON format!');
            return;
        }
        let searchesAmout = 0;
        let infos = [];
        for (const elem of fileContent) {
            if (Array.isArray(elem)) {
                searchesAmout++;
                const [type, name] = elem;
                const func = {
                    book: getBookInfos,
                    movie: getMovieInfos,
                    youtube: getVideoInfos,
                }[type];
                try {
                    let itemInfos = Object.assign({ type }, (yield func(name)));
                    infos.push(itemInfos);
                }
                catch (err) {
                    console.log('Err while trying to add ' + name);
                    console.log(err);
                    continue;
                }
            }
            else {
                infos.push(elem);
            }
        }
        if (searchesAmout) {
            const postResearchPath = filePath.replace('.json', '-enriched.json');
            fs.writeFileSync(postResearchPath, JSON.stringify(infos, null, 2));
            yield cmd('kitty --title floating -o remember_window_size=no -o initial_window_height=800 -o initial_window_width=1500 nvim ' +
                postResearchPath).catch(() => { });
            infos = JSON.parse(fs.readFileSync(postResearchPath).toString());
        }
        const htmls = infos.map(info => generateHtmlFor(info));
        fs.mkdirSync('/tmp/book-club', { recursive: true });
        fs.writeFileSync('/tmp/book-club/index.html', htmls.join('<hr style="margin: 30px; margin-bottom: 100px"/>'));
        console.log("Opening web page on 'http://localhost:8000'");
        cmd('vivaldi http://localhost:8000 &');
        cmd('php -S localhost:8000 -t /tmp/book-club/');
    });
}
main();
