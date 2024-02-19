return {
    -- {'z0rzi/vim-adaptive-indent', config=function() vim.cmd('autocmd BufReadPost * AdaptIndent') end },
    'z0rzi/nvim-fix-braces',
    'z0rzi/vim-zorzi-smoothie',
    'z0rzi/vim-smart-hits',
    'z0rzi/nvim-smallest-range',
    {
        'z0rzi/ai-chat.nvim',
        config = function() require('ai-chat').setup {} end,
    },
    {
        'z0rzi/until.nvim',
        config = function() require('until').setup {} end,
    },
    { 'z0rzi/lightline-bufferline',               dependencies = { 'itchyny/lightline.vim', } },
    {
        'nmac427/guess-indent.nvim',
        config = function() require('guess-indent').setup {} end,
    },
    -- 'takac/vim-hardtime',

    -- {'gptlang/CopilotChat.nvim', dependencies = { 'zbirenbaum/copilot.lua' }},

    'Yggdroot/indentLine',
    'HerringtonDarkholme/yats.vim',
    'maxmellon/vim-jsx-pretty',
    { 'nvim-telescope/telescope-fzf-native.nvim', build = 'make' },
    'tpope/vim-surround',
    { 'lewis6991/gitsigns.nvim', config = function() require('gitsigns').setup() end },
}
