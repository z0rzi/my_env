#!/bin/node
import { get } from 'https';
import jsdom from "jsdom";
const { JSDOM } = jsdom;

function error(errorMsg) {
    console.error(errorMsg);
    console.log('USAGE = scrap.js <link> --selector <CSS-selector> --regex <pattern> -H <header>');
    process.exit(1);
}

function parseArgs() {
    let args = [...process.argv.slice(2)]

    let out = {
        headers: {},
        link: '',
        selector: '',
        regex: ''
    }

    while (args.length) {
        arg = args.shift();
        if (arg === '-H') {
            const [key, value] = args.shift().split(/:\s*/)
            out.headers[key] = value;
        } else if(/^https?:\/\//.test(arg)) {
            out.link = arg;
        } else if(arg === '--selector') {
            out.selector += ' ' + args.shift()

        } else if(arg === '--regex') {
            out.regex += ' ' + args.shift()

        }
    }

    console.log(out);

    return out;
}

function fetchWebPage(args) {
    return new Promise((yay, nay) => {
        get(args.link, {
            headers: args.headers
        }, (resp) => {
            let data = '';

            resp.on('data', (chunk) => { data += chunk });

            resp.on('end', () => {
                let dom;
                try {
                    dom = new JSDOM(data)
                } catch (err) {
                    error('Could not parse the web page...');
                }

                if (resp.statusCode > 300 && resp.statusCode < 400) {
                    // Follow redirects
                    elem = dom.window.document.querySelector('a');
                    if (!elem) {
                        console.log(dom.window.document.body.innerHTML);
                        error('Couldn\'t find link for redirect');
                    }
                    args.link = elem.getAttribute('href')
                    fetchWebPage(args)
                        .then(yay)
                        .catch((err) => {
                            error(err);
                        })
                } else {
                    yay(dom.window.document);
                }
            });

        }).on("error", (err) => {
            nay(err);
        });
    });
}

const args = parseArgs();

fetchWebPage(args)
    .then((document) => {
        if (!!args.selector.length) {

            elems = [...document.querySelectorAll(args.selector)];

            elems.forEach(elem => {
                console.log(elem.innerHTML);
            });

            if (!!args.regex.length) {
            } else {
            }
        } else if (!!args.regex.length) {
        } else {
            console.log(document.body.innerHTML);
        }
    })
    .catch((err) => {
        error(err);
    });
