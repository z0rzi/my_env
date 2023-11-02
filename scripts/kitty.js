#!/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { cmd } from './shell.js';
let layout = null;
export function getLayout() {
    return __awaiter(this, void 0, void 0, function* () {
        if (layout)
            return layout;
        return cmd('kitty @ ls').then(res => {
            layout = JSON.parse(res);
            return layout;
        }).catch(err => {
            console.log('getLayout:47\t>', err);
            return [];
        });
    });
}
/**
 * Finds the currently focussed tab
 *
 * @returns `null` if no tab is focussed
 */
export function getFocussedTab() {
    return __awaiter(this, void 0, void 0, function* () {
        const layout = yield getLayout();
        for (const instance of layout) {
            for (const tab of instance.tabs) {
                if (!tab.is_focused)
                    continue;
                return tab;
            }
        }
        return null;
    });
}
export function getSelf() {
    return __awaiter(this, void 0, void 0, function* () {
        const layout = yield getLayout();
        const self = {
            instance: null,
            tab: null,
            window: null,
        };
        for (const instance of layout) {
            self.instance = instance;
            for (const tab of instance.tabs) {
                self.tab = tab;
                for (const win of tab.windows) {
                    self.window = win;
                    if (win.is_self)
                        return self;
                }
            }
        }
        return null;
    });
}
