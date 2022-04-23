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
import { mapArgs } from './shell.js';
import fs from 'fs';
import fetch from 'node-fetch';
import { checkInternet, getMyLocation } from './network.js';
const icons_hash_map = {
    '950': 'information',
    rainvolume: 'rain',
    aptemperature: 'temperature',
    '503': 'rain',
    '905': 'wind-2',
    '800': 'sun',
    '804': 'clouds',
    '802': 'sunclouds',
    '800-n': 'moon',
    '802-n': 'moonclouds',
    '600': 'snow',
    '701': 'mist',
    '200': 'storm',
};
const icons = {
    temperature: '🌡️',
    rainvolume: '🚿',
    pressure: '🪨',
    visibility: '👁️',
    humidity: '☔',
    moon: '🌙',
    moonclouds: '☁️🌙',
    sun: '☀️',
    wind: '🍃',
    'wind-2': '🌪️',
    sunclouds: '⛅',
    clouds: '☁️',
    storm: '⛈️',
    snow: '❄️',
    mist: '🌫️',
    rain: '🌧️',
    full: '🌕',
    sunrise: '🌅',
    sunset: '🌇',
};
function getIcon(iconId) {
    return icons[icons_hash_map[iconId] || iconId] || '';
}
function parseApiAnswer(raw) {
    return {
        temperature: raw.c.c,
        feels_like: raw.c.d,
        icon: getIcon(raw.c.b),
        text: raw.c.a,
        location: raw.b.i,
        sunrise: raw.s.a,
        sunset: raw.s.b,
    };
}
function getLocationId(location) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(`https://weawow.com/en/searchAjax?key=${location}`, {
            headers: {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,fr;q=0.8',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'sec-gpc': '1',
                'x-requested-with': 'XMLHttpRequest',
                Referer: 'https://weawow.com/',
            },
            method: 'GET',
        })
            .then((res) => __awaiter(this, void 0, void 0, function* () {
            return res.json();
        }))
            .catch(() => {
            return null;
        });
        try {
            return res.l[0].i;
        }
        catch (err) {
            return ''; // id for Grenoble
        }
    });
}
function getMeteoData(locId) {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch(`https://weawow.com/w3/en/weather?type=wowcity&lat=&lng=&c=b&weaUrl=c${locId}`, {
            headers: {
                HourUnit: '24H',
                Week: '',
                SpeedUnit: 'm/s',
                Accept: '*/*',
                Key: 'vn8k1lbk34JnViosBs0obWOn4Ippo5NVRG32a7WF',
                TemperatureUnit: 'Celsius',
                'X-Requested-With': 'XMLHttpRequest',
                PressureUnit: 'hPa',
                DistanceUnit: 'km',
                PC: 'true',
                'Sec-GPC': '1',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                Referer: 'https://weawow.com',
            },
            method: 'GET',
        })
            .then(res => {
            return res.json();
        })
            .then(res => {
            return parseApiAnswer(res);
        });
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield checkInternet()))
        return;
    let meteo = null;
    mapArgs({
        '--load=(?<file>.*)': (_, { file }) => {
            if (!fs.existsSync(file)) {
                console.error(`File ${file} does not exist`);
                process.exit(1);
            }
            try {
                meteo = JSON.parse(fs.readFileSync(file).toString());
            }
            catch (err) {
                console.error(`Error while parsing file ${file}`);
                process.exit(1);
            }
        },
        '--save=(?<file>.*)': (_, { file }) => __awaiter(void 0, void 0, void 0, function* () {
            if (!meteo) {
                const { country, city } = yield getMyLocation();
                const id = yield getLocationId(`${country}, ${city}`);
                meteo = meteo !== null && meteo !== void 0 ? meteo : (yield getMeteoData(id));
            }
            try {
                fs.writeFileSync(file, JSON.stringify(meteo));
            }
            catch (err) {
                console.error(`Error while writing file ${file}`);
                process.exit(1);
            }
        }),
        short: () => __awaiter(void 0, void 0, void 0, function* () {
            if (!meteo) {
                const { country, city } = yield getMyLocation();
                const id = yield getLocationId(`${country}, ${city}`);
                meteo = meteo !== null && meteo !== void 0 ? meteo : (yield getMeteoData(id));
            }
            console.log(`${meteo.icon} ${meteo.temperature}°`);
        }),
        long: () => __awaiter(void 0, void 0, void 0, function* () {
            if (!meteo) {
                const { country, city } = yield getMyLocation();
                const id = yield getLocationId(`${country}, ${city}`);
                meteo = meteo !== null && meteo !== void 0 ? meteo : (yield getMeteoData(id));
            }
            console.log(`Weather in ${meteo.location}:`);
            console.log();
            console.log(`\t${meteo.icon} ${meteo.temperature}°C - ${meteo.text}`);
            console.log(`\t${icons.sunrise} ${meteo.sunrise} ➜ ${meteo.sunset} ${icons.sunset}`);
        }),
        __no_matches__: () => __awaiter(void 0, void 0, void 0, function* () {
            const { country, city } = yield getMyLocation();
            const id = yield getLocationId(`${country}, ${city}`);
            meteo = meteo !== null && meteo !== void 0 ? meteo : (yield getMeteoData(id));
            console.log(JSON.stringify(meteo, null, 2));
        }),
    }, { multiMatch: true });
}))();
