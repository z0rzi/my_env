#!/bin/node

import path from 'path';
import { Cli } from './cli.js';
import { Explorer, ExplorerFile } from './explorer.js';
import { NO_ARGS_PROVIDED, openFile } from './shell.js';

export default class DualExplorer extends Explorer {
    cli2: Cli;

    rootFile2: ExplorerFile;
    previousFile2: ExplorerFile;
    _currentFile2: ExplorerFile;
    get currentFile2(): ExplorerFile {
        return this._currentFile2;
    }
    set currentFile2(newFile: ExplorerFile) {
        this.previousFile2 = this._currentFile2;
        this._currentFile2 = newFile;
    }

    constructor(path: string, onFileOpen?: (file: ExplorerFile) => unknown) {
        super(path, onFileOpen);
        this.cli.offHitKey();

        this.rootFile = new ExplorerFile(path + '/a');
        this.rootFile.open();
        this.currentFile = this.rootFile;

        this.rootFile2 = new ExplorerFile(path + '/b');
        this.rootFile2.open();
        this.currentFile2 = this.rootFile2;

        this.cli2 = new Cli(this.height, -1, -1, 30);
        this.cli2.onKeyHit(this.onInput.bind(this));
        this.cli2.toggleCursor(false);

        this.cli2.waitForReady.then(() => {
            this.refreshDisplay();
        });
    }

    refreshScreen(): void {
        this.correctOffset();

        this.rootFile.draw(this.cli, this.offset);
        this.rootFile2.draw(this.cli2, this.offset);
        this.cli.goToLine(this.currentFile.position - this.offset);
        this.clearAfterLast();
        this.refreshEmphasis();
    }

    refreshDisplay(): void {
        this.correctOffset();
        this.refreshScreen();
    }

    refreshEmphasis(): void {
        if (this.previousFile)
            this.previousFile.draw(this.cli, this.offset, false, false);
        if (this.currentFile)
            this.currentFile.draw(this.cli, this.offset, false, true);

        if (this.previousFile2)
            this.previousFile2.draw(this.cli2, this.offset, false, false);
        if (this.currentFile2)
            this.currentFile2.draw(this.cli2, this.offset, false, true);
    }

    clearAfterLast(): void {
        this.cli.goToLine(this.rootFile.height - this.offset - 1);
        while (this.cli.y < this.cli.maxHeight) {
            this.cli.down();
            this.cli.clearLine();
        }

        this.cli2.goToLine(this.rootFile2.height - this.offset - 1);
        while (this.cli2.y < this.cli2.maxHeight) {
            this.cli2.down();
            this.cli2.clearLine();
        }
    }

    open(recursive = false): void {
        if (!this.currentFile.isDirectory) {
            this.fileOpenListener(this.currentFile);
        } else {
            this.currentFile.open();
            if (this.currentFile2.isDirectory) this.currentFile2.open();

            this.refreshDisplay();
        }
    }
    close(recursive = false): void {
        this.currentFile = this.currentFile.close(recursive);
        this.currentFile2 = this.currentFile2.close(recursive);
        this.refreshDisplay();
    }

    goUp(toFirst: boolean): void {
        if (toFirst) {
            this.currentFile = this.currentFile.parent.visibleChildren[0];
            if (this.currentFile2.parent) {
                const kid2 = this.currentFile2.parent.children.find(
                    kid => kid.name === this.currentFile.name
                );
                if (kid2) this.currentFile2 = kid2;
            }
        } else {
            this.currentFile = this.currentFile.previous;
            this.currentFile2 = this.currentFile2.previous;
        }

        if (this.offset > 0 && this.currentFile.position - this.offset <= 0) {
            this.refreshDisplay();
        } else {
            this.refreshEmphasis();
        }
    }
    goDown(toLast: boolean): void {
        if (toLast) {
            const siblings = this.currentFile.parent.visibleChildren;
            this.currentFile = siblings[siblings.length - 1];

            if (this.currentFile2.parent) {
                const kid2 = this.currentFile2.parent.children.find(
                    kid => kid.name === this.currentFile.name
                );
                if (kid2) this.currentFile2 = kid2;
            }
        } else {
            this.currentFile = this.currentFile.next;
            this.currentFile2 = this.currentFile2.next;
        }

        if (this.currentFile.position - this.offset > this.cli.maxHeight) {
            this.refreshDisplay();
        } else {
            this.refreshEmphasis();
        }
    }
}

if (/dualExplorer\.js$/.test(process.argv[1])) {
    let inPath = '';

    if (NO_ARGS_PROVIDED) inPath = './';
    else inPath = process.argv[2];

    const cli = new Cli();

    const exp = new DualExplorer(path.resolve(inPath), file => {
        cli.offHitKey();

        openFile(file.path).then(() => {
            cli.onKeyHit(exp.onInput.bind(exp));
            cli.toggleCursor(false);
        });
    });
}
