import fetch from 'node-fetch';
import dns from 'dns';

export async function getMyIp(): Promise<string> {
    const res = await fetch('https://api.ipify.org?format=json').then(res =>
        res.json()
    );
    return res.ip;
}

export async function getMyLocation(): Promise<{
    country: string;
    city: string;
}> {
    const res = await fetch(
        'http://demo.ip-api.com/json/?fields=17&lang=en'
    ).then(res => res.json());
    return {
        country: res.country,
        city: res.city,
    };
}

export function checkInternet(): Promise<boolean> {
    return new Promise(resolve => {
        dns.lookup('google.com', function (err) {
            if (err && err.code == 'ENOTFOUND') {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}
