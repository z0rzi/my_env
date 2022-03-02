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
import { fuzzyFind } from './fuzzyFinder.js';
import * as git from './git.js';
import { cmd, mapArgs, NO_MATCH_FOUND } from './shell.js';
function checkDiff(commit1 = 'HEAD', commit2 = '') {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function chooseBranch() {
    return __awaiter(this, void 0, void 0, function* () {
        return git
            .getBranches()
            .then(branches => {
            return fuzzyFind(branches, 0);
        })
            .then(branch => branch.label.split(/\s+/g).pop())
            .catch(() => {
            process.exit(1);
        });
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
