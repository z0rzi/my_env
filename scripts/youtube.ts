#!/bin/bun

import fetch, { Headers } from 'node-fetch';

type VideoRenderer = {
    videoId: string;
    thumbnail: {
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[] /* x2 */;
    };
    title: {
        runs: {
            text: string;
        }[] /* x1 */;
        accessibility: {
            accessibilityData: {
                label: string;
            };
        };
    };
    longBylineText: {
        runs: {
            text: string;
            navigationEndpoint: {
                clickTrackingParams: string;
                commandMetadata: {
                    webCommandMetadata: {
                        url: string;
                        webPageType: string;
                        rootVe: number;
                        apiUrl: string;
                    };
                };
                browseEndpoint: {
                    browseId: string;
                    canonicalBaseUrl: string;
                };
            };
        }[] /* x1 */;
    };
    publishedTimeText: {
        simpleText: string;
    };
    lengthText: {
        accessibility: {
            accessibilityData: {
                label: string;
            };
        };
        simpleText: string;
    };
    viewCountText: {
        simpleText: string;
    };
    navigationEndpoint: {
        clickTrackingParams: string;
        commandMetadata: {
            webCommandMetadata: {
                url: string;
                webPageType: string;
                rootVe: number;
            };
        };
        watchEndpoint: {
            videoId: string;
            params: string;
            watchEndpointSupportedOnesieConfig: {
                html5PlaybackOnesieConfig: {
                    commonConfig: {
                        url: string;
                    };
                };
            };
        };
    };
    ownerText: {
        runs: {
            text: string;
            navigationEndpoint: {
                clickTrackingParams: string;
                commandMetadata: {
                    webCommandMetadata: {
                        url: string;
                        webPageType: string;
                        rootVe: number;
                        apiUrl: string;
                    };
                };
                browseEndpoint: {
                    browseId: string;
                    canonicalBaseUrl: string;
                };
            };
        }[] /* x1 */;
    };
    shortBylineText: {
        runs: {
            text: string;
            navigationEndpoint: {
                clickTrackingParams: string;
                commandMetadata: {
                    webCommandMetadata: {
                        url: string;
                        webPageType: string;
                        rootVe: number;
                        apiUrl: string;
                    };
                };
                browseEndpoint: {
                    browseId: string;
                    canonicalBaseUrl: string;
                };
            };
        }[] /* x1 */;
    };
    trackingParams: string;
    showActionMenu: boolean;
    shortViewCountText: {
        accessibility: {
            accessibilityData: {
                label: string;
            };
        };
        simpleText: string;
    };
    menu: {
        menuRenderer: {
            items: {
                menuServiceItemRenderer: {
                    text: {
                        runs: {
                            text: string;
                        }[] /* x1 */;
                    };
                    icon: {
                        iconType: string;
                    };
                    serviceEndpoint: {
                        clickTrackingParams: string;
                        commandMetadata: {
                            webCommandMetadata: {
                                sendPost: boolean;
                            };
                        };
                        signalServiceEndpoint: {
                            signal: string;
                            actions: {
                                clickTrackingParams: string;
                                addToPlaylistCommand: {
                                    openMiniplayer: boolean;
                                    videoId: string;
                                    listType: string;
                                    onCreateListCommand: {
                                        clickTrackingParams: string;
                                        commandMetadata: {
                                            webCommandMetadata: {
                                                sendPost: boolean;
                                                apiUrl: string;
                                            };
                                        };
                                        createPlaylistServiceEndpoint: {
                                            videoIds: string[] /* x1 */;
                                            params: string;
                                        };
                                    };
                                    videoIds: string[] /* x1 */;
                                };
                            }[] /* x1 */;
                        };
                    };
                    trackingParams: string;
                };
            }[] /* x1 */;
            trackingParams: string;
            accessibility: {
                accessibilityData: {
                    label: string;
                };
            };
        };
    };
    channelThumbnailSupportedRenderers: {
        channelThumbnailWithLinkRenderer: {
            thumbnail: {
                thumbnails: {
                    url: string;
                    width: number;
                    height: number;
                }[] /* x1 */;
            };
            navigationEndpoint: {
                clickTrackingParams: string;
                commandMetadata: {
                    webCommandMetadata: {
                        url: string;
                        webPageType: string;
                        rootVe: number;
                        apiUrl: string;
                    };
                };
                browseEndpoint: {
                    browseId: string;
                    canonicalBaseUrl: string;
                };
            };
            accessibility: {
                accessibilityData: {
                    label: string;
                };
            };
        };
    };
    thumbnailOverlays: {
        thumbnailOverlayTimeStatusRenderer?: {
            text: {
                accessibility: {
                    accessibilityData: {
                        label: string;
                    };
                };
                simpleText: string;
            };
            style: string;
        };
        thumbnailOverlayToggleButtonRenderer?: {
            isToggled: boolean;
            untoggledIcon: {
                iconType: string;
            };
            toggledIcon: {
                iconType: string;
            };
            untoggledTooltip: string;
            toggledTooltip: string;
            untoggledServiceEndpoint: {
                clickTrackingParams: string;
                commandMetadata: {
                    webCommandMetadata: {
                        sendPost: boolean;
                        apiUrl: string;
                    };
                };
                playlistEditEndpoint: {
                    playlistId: string;
                    actions: {
                        addedVideoId: string;
                        action: string;
                    }[] /* x1 */;
                };
            };
            toggledServiceEndpoint: {
                clickTrackingParams: string;
                commandMetadata: {
                    webCommandMetadata: {
                        sendPost: boolean;
                        apiUrl: string;
                    };
                };
                playlistEditEndpoint: {
                    playlistId: string;
                    actions: {
                        action: string;
                        removedVideoId: string;
                    }[] /* x1 */;
                };
            };
            untoggledAccessibility: {
                accessibilityData: {
                    label: string;
                };
            };
            toggledAccessibility: {
                accessibilityData: {
                    label: string;
                };
            };
            trackingParams: string;
        };
        thumbnailOverlayNowPlayingRenderer?: {
            text: {
                runs: {
                    text: string;
                }[] /* x1 */;
            };
        };
    }[] /* x4 */;
    detailedMetadataSnippets: {
        snippetText: {
            runs: {
                text: string;
                bold?: boolean;
            }[] /* x5 */;
        };
        snippetHoverText: {
            runs: {
                text: string;
            }[] /* x1 */;
        };
        maxOneLine: boolean;
    }[] /* x1 */;
};

type YtRawRes = {
    twoColumnSearchResultsRenderer: {
        primaryContents: {
            sectionListRenderer: {
                contents: [
                    {
                        itemSectionRenderer: {
                            contents: {
                                videoRenderer?: VideoRenderer;
                                channelRenderer?: {};
                                shelfRenderer?: {};
                                radioRenderer?: {};
                            }[];
                        };
                    },
                    { continuationItemRenderer: {} }
                ];
            };
        };
    };
};

type SearchResult = {
    id: string;
    title: string;
    views: string;
    year: string;
    length: string;
    imageUrl: string;
    source: string;
};

type VideoInfos = {
    title: string;
    year: string;
    description: string;
    author: string;
    source: string;
    imageUrl: string;
    length: string;
    rating: string;
};

function getJsonAfter(raw: string, word: string) {
    const rx = new RegExp(`^[\\S\\s]*?${word}.*?{`, '');
    raw = raw.replace(rx, '{');

    let rawJson = '';
    let stack = 0;

    for (let i = 0; i < raw.length; i++) {
        const cara = raw[i];
        const lastCara = i > 0 ? raw[i - 1] : '';

        if (lastCara !== '\\') {
            if (cara === '{') stack++;
            if (cara === '}') stack--;
        }
        rawJson += cara;
        if (!stack) break;
    }

    try {
        return JSON.parse(rawJson);
    } catch (err) {
        console.log('Invalid JSON...');
        return;
    }
}

async function search(searchStr: string): Promise<SearchResult[]> {
    let res = await fetch(
        'https://www.youtube.com/results?search_query=' +
            encodeURIComponent(searchStr),
        {
            headers: new Headers({
                cookie: 'PREF=tz=Europe.Paris&gl=US&hl=en',
            }),
        }
    ).then(res => res.text());

    const parsedJson = getJsonAfter(res, 'estimatedResults":[^,]*,"contents');

    const out = [] as SearchResult[];

    for (const searchResult of parsedJson.twoColumnSearchResultsRenderer
        .primaryContents.sectionListRenderer.contents[0].itemSectionRenderer
        .contents) {
        if (!('videoRenderer' in searchResult)) continue;

        try {
            out.push({
                id: searchResult.videoRenderer.videoId,
                title: searchResult.videoRenderer.title.runs[0].text,
                views: searchResult.videoRenderer.shortViewCountText.simpleText,
                year: searchResult.videoRenderer.publishedTimeText.simpleText,
                length: searchResult.videoRenderer.lengthText.simpleText,
                imageUrl:
                    searchResult.videoRenderer.thumbnail.thumbnails[0].url,
                source:
                    'https://www.youtube.com/watch?v=' +
                    searchResult.videoRenderer.videoId,
            });
        } catch (err) {
            continue;
        }
    }

    return out;
}

async function getVideoExtraInfos(id: string): Promise<{
    description: string;
    author: string;
    rating: string;
}> {
    let res = await fetch('https://www.youtube.com/watch?v=' + id, {
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
}

export async function getVideoInfos(videoName: string): Promise<VideoInfos> {
    const basicInfos = await search(videoName);
    return {
        ...basicInfos[0],
        ...await getVideoExtraInfos(basicInfos[0].id)
    };
}
