#!/bin/bun

import fs from 'fs';
import kl from 'kleur';
import path from 'path';
import prompts from 'prompts';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import { encodeLink } from './hyperlink.js';
import { cmd } from './shell.js';

const options: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
};

// when setting all options in a single object
const git: SimpleGit = simpleGit(options);

const categories = [
    {
        title: 'feat',
        description: 'New features',
    },
    { title: 'fix', description: 'Bug fix' },
    {
        title: 'chore',
        description:
            "No changes to 'src/' or 'tests/', e.g. updating dependencies",
    },
    {
        title: 'refactor',
        description:
            'refactored code that neither fixes a bug nor adds a feature',
    },
    {
        title: 'docs',
        description: 'updated the documentation or code comments',
    },
    {
        title: 'test',
        description: 'including new or correcting previous tests',
    },
    { title: 'perf', description: 'performance improvements' },
];

(async () => {
    let gitRoot = '';
    try {
        gitRoot = await git.revparse(['--show-toplevel']);
    } catch (err) {
        console.log("You don't seem to be in a git repository...");
        process.exit(1);
    }

    process.chdir(gitRoot);

    const rawCommitedFiles = (
        await git.diff(['--staged', '--name-only'])
    ).trim();

    if (!rawCommitedFiles) {
        console.log(kl.red('No file have been added for commit.\n'));
        console.log('Start by running ' + kl.blue('git add ...'));
        process.exit(1);
    }

    const commitedFiles = rawCommitedFiles.split(/\n/g);

    const diff = await git.diff(['--staged']);

    {
        let dangerMessage = '';
        let filenameLogged = false;
        let filePath = '';

        const logCode = async (code: string) => {
            // Get the file name from the variable filePath
            const fileName = path.basename(filePath);

            const _filePath = '/tmp/' + fileName;
            fs.writeFileSync(_filePath, code);
            const coloredCode = await cmd('bat --color=always -pp ' + _filePath)
            dangerMessage += coloredCode + '\n';
        };
        const logFileName = () => {
            if (!filenameLogged) {
                filenameLogged = true;
                dangerMessage += '\n' + encodeLink(filePath) + '\n';
            }
        };

        for (let diffLine of diff.split('\n')) {
            if (diffLine.startsWith('+++')) {
                filenameLogged = false;
                filePath = diffLine.slice(6);
            } else if (diffLine.startsWith('+')) {
                // Text has been added
                diffLine = diffLine.slice(2);

                if (/^\s*\/\//.test(diffLine)) {
                    logFileName();
                    await logCode(diffLine);
                }
                if (/TODO/.test(diffLine)) {
                    logFileName();
                    await logCode(diffLine);
                }
                if (/\bconsole\b/.test(diffLine)) {
                    logFileName();
                    await logCode(diffLine);
                }
                if (/\bdebug\b/.test(diffLine)) {
                    logFileName();
                    await logCode(diffLine);
                }
            }
        }

        if (dangerMessage.length) {
            console.log(
                'The commited code seems to contain logs or comments...'
            );
            console.log(dangerMessage);

            const confirm = await prompts({
                type: 'confirm',
                name: 'confirmCommit',
                message: 'Are you sure you want to commit these changes?',
                initial: true,
            });

            if (!confirm.confirmCommit) process.exit(1);
        }
    }

    console.log(`\nAbout to commit ${kl.blue(commitedFiles.length)} files.\n`);

    const res = await prompts([
        {
            type: 'autocomplete',
            name: 'category',
            initial: '',
            message: 'Pick a category',
            choices: categories.map(prop => ({
                title: prop.title,
                description: prop.description,
            })),
        },
        {
            type: 'text',
            name: 'action',
            initial: '',
            message: 'What did you do?',
        },
    ]);

    if (!res.action || !res.action) {
        process.exit(1);
    }

    await git.commit(`[${res.category}] - ${res.action}`);

    const commit = (await git.log()).latest;

    console.log(
        `\n${(kl.red(kl.italic(commit.hash.slice(0, 9)) + ` (${kl.blue(commit.refs)})`))} ${
            commit.message
        }`
    );

    console.log(kl.green('\nFiles successfully commited.'));
})();
