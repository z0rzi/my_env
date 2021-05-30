#!/bin/node
import { fuzzyFind } from './fuzzyFinder.js';
import * as git from './git.js';
import { cmd, mapArgs, NO_MATCH_FOUND } from './shell.js';
async function checkDiff(commit1 = 'HEAD', commit2 = '') {
    const gitRoot = git.getRootPath();
    const c1 = commit1 || gitRoot;
    const c2 = commit2 || gitRoot;
    return git
        .getFilesDiff(c1, c2)
        .then(files => {
        if (!files.length) {
            console.log('No unstaged files!');
            process.exit(1);
        }
        return fuzzyFind(files, 0);
    })
        .then(choice => {
        if (!choice)
            return;
        const choosenFile = choice.label;
        let c1 = commit1;
        if (c1)
            c1 += ':';
        else
            c1 = gitRoot + '/';
        c1 += choosenFile;
        let c2 = commit2;
        if (c2)
            c2 += ':';
        else
            c2 = gitRoot + '/';
        c2 += choosenFile;
        return cmd(`git difftool ${c1} ${c2}`);
    })
        .then(() => {
        return checkDiff(commit1, commit2);
    })
        .catch(() => {
        process.exit(1);
    });
}
async function chooseBranch() {
    return git
        .getBranches()
        .then(branches => {
        return fuzzyFind(branches, 0);
    })
        .then(branch => branch.label.split(/\s+/g).pop())
        .catch(() => {
        process.exit(1);
    });
}
mapArgs({
    '-cc|--choose-commit': () => {
        chooseBranch().then(branch => checkDiff(branch));
    },
    '-h|--help': () => {
        console.log('');
        console.log('USAGE = "git-diff.js [-cc | --chose-commit]"');
        console.log('');
        console.log('    Checks the difference between the current state and a given commit (or HEAD if -cc is not used)');
        console.log('');
        process.exit(0);
    },
    [NO_MATCH_FOUND]: () => checkDiff(),
});
function then(arg0) {
    throw new Error('Function not implemented.');
}
//# sourceMappingURL=git-diff.js.map