type QsSearchRes<T> = {
    /** The highest score among all the keys */
    "score": number,

    /** The highest score */
    "scoreKey": string,

    /** The item with the highest score */
    "item": T,

    /** The scores for each of the keys */
    "scores": { [key: string]: number },

    /** The positions of the matches */
    "matches": { [key: string]: number[][] },
};

declare module 'quick-score' {
    export class QuickScore {
        constructor(
            obj: {[prop_name: string]: string | unknown}[],
            properties: string[]
        )

        search<T>(text: string): QsSearchRes<T>[];
    }
}
