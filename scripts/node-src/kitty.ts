#!/bin/env node

import { cmd, sourceCmd } from './shell.js';

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

export async function getLayout() {
    return cmd('kitty @ ls').then(res => {
        return JSON.parse(res) as KittyLayout[];
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
