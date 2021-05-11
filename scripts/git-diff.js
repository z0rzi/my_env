#!/bin/node
import { __awaiter } from "tslib";
import { fuzzyFind } from './cli.js';
import * as git from './git.js';
import { cmd, mapArgs } from './shell.js';
function checkDiff(commit1 = 'HEAD', commit2 = '') {
    return __awaiter(this, void 0, void 0, function* () {
        let gitRoot = '';
        return git.getRootPath()
            .then(root => {
            let c1 = commit1 || root;
            let c2 = commit2 || root;
            gitRoot = root;
            return git.getFilesDiff(c1, c2);
        })
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
            let choosenFile = choice.label;
            if (commit1)
                commit1 += ':';
            else
                commit1 = gitRoot + '/';
            commit1 += choosenFile;
            if (commit2)
                commit2 += ':';
            else
                commit2 = gitRoot + '/';
            commit2 += choosenFile;
            return cmd(`git difftool ${commit1} ${commit2}`);
        })
            .then(() => {
            process.exit(0);
        })
            .catch(() => {
            process.exit(1);
        });
    });
}
function chooseBranch() {
    return __awaiter(this, void 0, void 0, function* () {
        return git.getBranches()
            .then(branches => {
            return fuzzyFind(branches, 0);
        })
            .then(branch => branch.label.split(/\s+/g).pop());
    });
}
mapArgs({
    '-cc|--choose-commit': () => {
        chooseBranch()
            .then(branch => checkDiff(branch));
    }
}, () => {
    checkDiff();
});
//# sourceMappingURL=git-diff.js.map