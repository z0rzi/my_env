#!/bin/bun

import fetch from 'node-fetch';
import clipboardy from 'clipboardy';

type ReversoCorrection = {
    group: string;
    type: string;
    shortDescription: string;
    longDescription: string;
    startIndex: number;
    endIndex: number;
    mistakeText: string;
    correctionText: string;
    suggestions: { text: string }[];
};

type ReversoCorrectedSentence = {
    id: string;
    language: string;
    text: string;
    engine: string;
    truncated: string;
    timeTaken: number;
    corrections: ReversoCorrection[];
    autoReplacements: {
        startIndex: number;
        endIndex: number;
        mistakeText: string;
        replacementText: string;
    }[];
};

async function reverso(text: string): Promise<Mistake[]> {
    const body = {
        englishDialect: 'indifferent',
        autoReplace: false,
        getCorrectionDetails: true,
        interfaceLanguage: 'fr',
        locale: '',
        language: 'fra',
        text,
        originalText: '',
        spellingFeedbackOptions: {
            insertFeedback: true,
            userLoggedOn: true,
        },
        origin: 'interactive',
    };

    return fetch('https://orthographe.reverso.net/api/v1/Spelling/', {
        headers: {
            'content-type': 'application/*+json',
            accept: 'text/json',
            origin: 'https://www.reverso.net',
            referer: 'https://www.reverso.net/',
            'user-agent':
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.167 Safari/537.36',
        },
        body: JSON.stringify(body),
        method: 'POST',
    })
        .then(res => {
            return res.json();
        })
        .then((res: ReversoCorrectedSentence) => {
            const mistakes = res.corrections.map(corr => ({
                originalText: corr.mistakeText,
                from: corr.startIndex,
                to: corr.endIndex + 1,
                message: corr.longDescription,
                replacement: corr.suggestions[0].text,
            }));
            mistakes.push(
                ...res.autoReplacements.map(repl => ({
                    originalText: repl.mistakeText,
                    from: repl.startIndex,
                    to: repl.endIndex + 1,
                    message: 'Remplacement Automatique',
                    replacement: repl.replacementText,
                }))
            );
            return mistakes;
        });
}

type CorrectorMatch = {
    message: 'Faute de frappe possible trouvée.';
    shortMessage: 'Faute de frappe';
    replacements: { value: string }[];
    offset: number;
    length: number;
    context: {
        text: string;
        offset: number;
        length: number;
    };
    sentence: string;
    rule: {
        id: string;
        description: string;
        issueType: string;
        category: {
            id: string;
            name: string;
        };
    };
};
type CorrectorResponse = {
    matches: CorrectorMatch[];
};
async function corrector_co(text: string): Promise<Mistake[]> {
    const body = new URLSearchParams();
    body.append('language', 'fr');
    body.append('text', text);

    return fetch('https://api.languagetool.org/v2/check', {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        body,
        method: 'POST',
    })
        .then(res => res.json())
        .then((res: CorrectorResponse) => {
            return res.matches.map(match => ({
                originalText: text.slice(match.offset, match.offset + match.length),
                from: match.offset,
                to: match.offset + match.length,
                message: match.message,
                replacement: match.replacements[0].value,
            }));
        });
}

export type Mistake = {
    from: number;
    to: number;
    message: string;
    originalText: string;
    replacement: string;
};

export async function findMistakes(sentence: string): Promise<Mistake[]> {
    if (!sentence) return []
    return reverso(sentence).catch(() => corrector_co(sentence));
}

export async function correctSentence(sentence: string): Promise<string> {
    const mistakes = await findMistakes(sentence);
    console.log(mistakes);

    for (const mistake of mistakes.reverse()) {
        const before = sentence.slice(0, mistake.from);
        const after = sentence.slice(mistake.to);
        sentence = before + mistake.replacement + after;
    }

    return sentence;
}

if (/correct.js/.test(process.argv[1])) {
    let content = '';

    if (process.argv.length > 2) content = process.argv.slice(2).join(' ');
    else content = clipboardy.readSync();

    if (!content) {
        process.exit(1);
    }

    correctSentence(content).then(res => {
        console.log(res);
        clipboardy.writeSync(res);
        console.log('Corrected sentence in the clipboard!');
    });
}
