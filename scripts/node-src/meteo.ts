#!/bin/node

import { mapArgs } from './shell.js';
import fs from 'fs';
import fetch from 'node-fetch';

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

function getIcon(iconId: string): string {
    return icons[icons_hash_map[iconId] || iconId] || '';
}

type Meteo = {
    temperature: number;
    feels_like: number;
    text: string;
    icon: string;
    location: string;

    sunrise: string;
    sunset: string;
};

function parseApiAnswer(raw: any): Meteo {
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

async function getLocationId(location: string): Promise<string> {
    const res = await fetch(
        `https://weawow.com/fr/searchAjax?keyword=${location}&microtime=1623764380326`,
        {
            headers: {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,fr;q=0.8',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'sec-gpc': '1',
                'x-requested-with': 'XMLHttpRequest',
            },
            body: null,
            method: 'GET',
        }
    ).then(res => {
        return res.json();
    });

    try {
        return res.data.l[0].i;
    } catch (err) {
        return '9013811'; // id for Grenoble
    }
}

async function getMeteoData(locId: string): Promise<Meteo> {
    return fetch(
        `https://weawow.com/w3/fr/weather?type=wowcity&lat=&lng=&c=b&weaUrl=c${locId}`,
        {
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
        }
    )
        .then(res => {
            return res.json();
        })
        .then(res => {
            return parseApiAnswer(res);
        });
}

(async () => {
    // const id = await getLocationId('grenoble');
    const id = '9013811'; // Grenoble
    let meteo: Meteo = null;

    mapArgs(
        {
            '--load=(?<file>.*)': (_: string, { file }: { file: string }) => {
                if (!fs.existsSync(file)) {
                    console.error(`File ${file} does not exist`);
                    process.exit(1);
                }
                try {
                    meteo = JSON.parse(fs.readFileSync(file).toString());
                } catch (err) {
                    console.error(`Error while parsing file ${file}`);
                    process.exit(1);
                }
            },
            '--save=(?<file>.*)': async (
                _: string,
                { file }: { file: string }
            ) => {
                meteo = meteo ?? (await getMeteoData(id));
                try {
                    fs.writeFileSync(file, JSON.stringify(meteo));
                } catch (err) {
                    console.error(`Error while writing file ${file}`);
                    process.exit(1);
                }
            },
            short: async () => {
                meteo = meteo ?? (await getMeteoData(id));
                console.log(`${meteo.icon} ${meteo.temperature}°`);
            },
            long: async () => {
                meteo = meteo ?? (await getMeteoData(id));
                console.log(`Weather in ${meteo.location}:`);
                console.log();
                console.log(
                    `\t${meteo.icon} ${meteo.temperature}°C - ${meteo.text}`
                );
                console.log(
                    `\t${icons.sunrise} ${meteo.sunrise} ➜ ${meteo.sunset} ${icons.sunset}`
                );
            },
            __no_matches__: async () => {
                meteo = meteo ?? (await getMeteoData(id));
                console.log(JSON.stringify(meteo, null, 2));
            },
        },
        { multiMatch: false }
    );
})();
