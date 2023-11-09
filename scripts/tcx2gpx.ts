#!/bin/bun

import fs from 'fs';

import { HtmlNode, NodeObject } from './html.js';

const files = process.argv.slice(2);

for (const file of files) {
    const rawContent = fs.readFileSync(file, { encoding: 'utf8' });

    const node = new HtmlNode(rawContent);

    let sport = '';
    const records: {
        time: Date;
        lat: string;
        lng: string;
        alt: string;
    }[] = [];

    node.children.forEach(kid => {
        if (kid.tag === 'Activities') {
            kid.children.forEach(actNode => {
                if (actNode.tag !== 'Activity') return;
                sport = actNode.props['Sport'];

                actNode.children.forEach(lapNode => {
                    if (lapNode.tag !== 'Lap') return;

                    lapNode.children.forEach(trackNode => {
                        if (trackNode.tag !== 'Track') return;

                        trackNode.children.forEach(trackPointNode => {
                            if (trackPointNode.tag !== 'Trackpoint') return;

                            let lat = '';
                            let lng = '';
                            let time = '';
                            let alt = '';

                            trackPointNode.children.forEach(pointInfos => {
                                if (pointInfos.tag === 'Time')
                                    time = pointInfos.innerText;
                                if (pointInfos.tag === 'AltitudeMeters')
                                    alt = pointInfos.innerText;
                                if (pointInfos.tag === 'Position') {
                                    pointInfos.children.forEach(posNode => {
                                        if (posNode.tag === 'LatitudeDegrees')
                                            lat = posNode.innerText;
                                        if (posNode.tag === 'LongitudeDegrees')
                                            lng = posNode.innerText;
                                    });
                                }
                            });
                            if (!lat || !lng) return;
                            records.push({
                                time: new Date(time),
                                lat,
                                lng,
                                alt,
                            });
                        });
                    });
                });
            });
        }
    });

    records.sort((rec1, rec2) => +rec1.time - +rec2.time);

    const firstDate = records[0].time.toISOString();

    const out: NodeObject = {
        tag: 'gpx',
        props: {
            xmlns: 'http://www.topografix.com/GPX/1/1',
            'xmlns:gpxx': 'http://www.garmin.com/xmlschemas/GpxExtensions/v3',
            'xmlns:gpxtpx':
                'http://www.garmin.com/xmlschemas/TrackPointExtension/v1',
            creator: 'Oregon 400t',
            version: '1.1',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation':
                'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd',
        },
        children: [
            {
                tag: 'metadata',
                children: [
                    {
                        tag: 'link',
                        props: { href: 'http://www.garmin.com' },
                        children: [
                            { tag: 'text', children: ['Garmin International'] },
                        ],
                    },
                    { tag: 'time', children: [firstDate] },
                ],
            },
            {
                tag: 'trk',
                children: [
                    { tag: 'name', children: [firstDate.slice(0, 10) + ' ~ ' + sport] },
                    {
                        tag: 'trkseg',
                        children: records.map(record => {
                            return {
                                tag: 'trkpt',
                                props: { lat: record.lat, lon: record.lng },
                                children: [
                                    { tag: 'ele', children: [record.alt] },
                                    {
                                        tag: 'time',
                                        children: [record.time.toISOString()],
                                    },
                                ],
                            };
                        }),
                    },
                ],
            },
        ],
    };

    console.log(
        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n\n' +
            HtmlNode.fromObject(out).toHTML()
    );
}
