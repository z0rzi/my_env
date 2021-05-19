import { CliColor, StyleOptions } from './cli.js';

const ICONS = {
    folder_closed: '⯈',
    folder_open: '⯆',

    settings: '',
    script: '',
    config: '',
    image: '',
    diff: '',
    database: '',
    git: '',
    rss: '',
    page: '🖹',

    docker: '',
    scss: '',
    html: '',
    css: '',
    markdown: '',
    braces: '',
    javascript: '',
    react: '',
    ruby: '',
    php: '',
    python: '',
    coffee: '',
    c: '',
    cSharp: '',
    h: '',
    hs: '',
    twig: '',
    nix: '',
    lua: '',
    java: '',
    lambda: 'λ',
    mustache: '',
    clj: '',
    cljs: '',
    edn: '',
    scala: '',
    go: '',
    dart: '',
    xul: '',
    vscode: '',
    pl: '',
    fsscript: '',
    rlib: '',
    d: '',
    erl: '',
    ex: '',
    vim: '',
    animate: '',
    photoshop: '',
    ts: '',
    jl: '',
    pp: '',
    vue: '﵂',
    elm: '',
    swift: '',
    latex: 'ﭨ',
    r: 'ﳒ',
};

type Design = {
    icon: string;
    iconColor?: CliColor;
    textStyle?: StyleOptions;
};

const DESIGNS: { [type: string]: Design & { rxs: RegExp[] } } = {
    //
    // Files exact match
    //
    gitIgnore: {
        icon: ICONS.git,
        textStyle: { color: CliColor.BLACK, italic: true },
        rxs: [/^\.gitignore$/],
    },
    prettierIgnore: {
        icon: ICONS.settings,
        textStyle: { color: CliColor.BLACK, italic: true },
        rxs: [/^\.prettierignore$/],
    },
    dockerfile: {
        icon: ICONS.docker,
        iconColor: CliColor.BLUE,
        rxs: [/^Dockerfile$/],
    },
    vimrc: {
        icon: ICONS.vim,
        iconColor: CliColor.GREEN,
        rxs: [/^\.?vimrc$/],
    },

    //
    // Languages specific
    //
    javascript: {
        icon: ICONS.javascript,
        iconColor: CliColor.RED,
        rxs: [/\.js$/],
    },
    typescript: {
        icon: ICONS.javascript,
        iconColor: CliColor.RED,
        rxs: [/\.ts$/],
    },
    react: {
        icon: ICONS.react,
        iconColor: CliColor.RED,
        rxs: [/\.[jt]sx$/],
    },
    python: {
        icon: ICONS.python,
        iconColor: CliColor.RED,
        rxs: [/\.py$/],
    },

    html: {
        icon: ICONS.html,
        iconColor: CliColor.YELLOW,
        rxs: [/\.html/],
    },

    scss: {
        icon: ICONS.scss,
        iconColor: CliColor.YELLOW,
        rxs: [/\.s[ca]ss/],
    },

    json: {
        icon: ICONS.braces,
        // textStyle: { color: CliColor.BLACK },
        iconColor: CliColor.CYAN,
        rxs: [/\.json$/],
    },
    yaml: {
        icon: ICONS.page,
        iconColor: CliColor.CYAN,
        // textStyle: { color: CliColor.BLACK },
        rxs: [/\.ya?ml$/],
    },
    markdown: {
        icon: ICONS.markdown,
        iconColor: CliColor.CYAN,
        rxs: [/\.md$/],
    },
    vim: {
        icon: ICONS.vim,
        iconColor: CliColor.GREEN,
        rxs: [/\.vim$/],
    },

    //
    // General Types
    //
    database: {
        icon: ICONS.database,
        iconColor: CliColor.YELLOW,
        rxs: [/\.sql$/],
    },
    scripts: {
        icon: ICONS.script,
        iconColor: CliColor.BLACK,
        rxs: [/\.sh$/, /\.ps1$/, /\.bat$/, /\.fish/],
    },
    image: {
        icon: ICONS.page,
        textStyle: { color: CliColor.BLACK },
        rxs: [/\.(?:png|je?pg|kra|mp4|kdenlive)$/],
    },
    documents: {
        icon: ICONS.page,
        textStyle: { color: CliColor.BLACK },
        rxs: [/\.(?:pdf|xls)$/],
    },
    text: {
        icon: ICONS.page,
        textStyle: { color: CliColor.BLACK },
        rxs: [/\.(?:pdf|xls)$/],
    },
    prettier: {
        icon: ICONS.settings,
        textStyle: { color: CliColor.BLACK },
        rxs: [/prettier/],
    },
    config: {
        icon: ICONS.settings,
        textStyle: { color: CliColor.BLACK, italic: true },
        rxs: [/\.(?:conf|snippets)$/],
    },

    //
    // last priority
    //
    dotFiles: {
        icon: ICONS.settings,
        textStyle: {
            color: CliColor.BLACK,
            italic: true,
        },
        rxs: [/^\./],
    },
    testFiles: {
        icon: ICONS.settings,
        textStyle: {
            color: CliColor.BLACK,
            italic: true,
        },
        rxs: [/\.spec$/],
    },
};

export { ICONS };

export function getStyleFor(file: string): Design {
    file = file.replace(/^.*\//, '');

    for (const design of Object.values(DESIGNS))
        if (design.rxs.some(rx => rx.test(file)))
            return {
                icon: design.icon,
                iconColor: design.iconColor,
                textStyle: design.textStyle,
            };

    return {
        icon: '?',
        textStyle: {
            color: CliColor.BLACK,
            italic: true,
        },
    };
}
