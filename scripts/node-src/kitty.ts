#!/bin/env node

import { cmd } from './shell.js';

interface KittyProcess {
    /** e.g. ['nvim', 'script.ts'] */
    cmdline: string[];
    cwd: string;
    pid: number;
}

interface KittyWindow {
    id: number;
    pid: number;
    title: string;
    cmdline: string[];
    cwd: string;
    is_focussed: boolean;
    is_self: boolean;
    foreground_processes: KittyProcess[];
    env: Record<string, string>;
}

interface KittyTab {
    id: number;
    active_window_history: number[];
    is_focused: true;
    layout: 'splits';
    title: string;
    windows: KittyWindow[];
}

interface KittyLayout {
    id: number;
    id_focussed: boolean;
    platform_window_id: number;
    tabs: KittyTab[];
}

let layout = null as KittyLayout[] | null;
export async function getLayout() {
    if (layout) return layout;
    return cmd('kitty @ ls')
        .then(res => {
            layout = JSON.parse(res) as KittyLayout[];
            return layout;
        })
        .catch(err => {
            console.log('getLayout:47\t>', err);
            return [];
        });
}

/**
 * Finds the currently focussed tab
 *
 * @returns `null` if no tab is focussed
 */
export async function getFocussedTab() {
    const layout = await getLayout();
    for (const instance of layout) {
        for (const tab of instance.tabs) {
            if (!tab.is_focused) continue;

            return tab;
        }
    }

    return null;
}

export async function getSelf(): Promise<null | {
    instance: KittyLayout;
    tab: KittyTab;
    window: KittyWindow;
}> {
    const layout = await getLayout();

    const self = {
        instance: null as KittyLayout | null,
        tab: null as KittyTab | null,
        window: null as KittyWindow | null,
    };

    for (const instance of layout) {
        self.instance = instance;
        for (const tab of instance.tabs) {
            self.tab = tab;
            for (const win of tab.windows) {
                self.window = win;
                if (win.is_self)
                    return self as {
                        instance: KittyLayout;
                        tab: KittyTab;
                        window: KittyWindow;
                    };
            }
        }
    }

    return null;
}
