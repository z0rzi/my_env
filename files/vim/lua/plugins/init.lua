return {
    -- {'z0rzi/vim-adaptive-indent', config=function() vim.cmd('autocmd BufReadPost * AdaptIndent') end },
    'z0rzi/nvim-fix-braces',
    'z0rzi/vim-zorzi-smoothie',
    'z0rzi/vim-smart-hits',
    'z0rzi/nvim-smallest-range',
    -- {
    --     'z0rzi/open-from-chrome.nvim',
    --     config = function() require('open-from-chrome').setup {} end,
    -- },
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

    {
        'dyng/ctrlsf.vim',
        config = function()
            vim.g.ctrlsf_auto_focus = {
                at = 'start'
            }

            vim.g.ctrlsf_auto_close = {
                normal = 1,
                compact = 1
            }
            vim.g.ctrlsf_mapping = {
                chgmode = "<TAB>",
                open    = { "<CR>", "o", "<2-LeftMouse>" },
                openb   = "O",
                split   = "<C-O>",
                vsplit  = "",
                tab     = "t",
                tabb    = "T",
                popen   = "p",
                popenf  = "P",
                quit    = "q",
                stop    = "<C-C>",
                next    = "<C-J>",
                prev    = "<C-K>",
                nfile   = "<C-N>",
                pfile   = "<C-P>",
                pquit   = "q",
                loclist = "",
                fzf     = "<C-T>",
            }
        end
    },
    'Yggdroot/indentLine',
    'HerringtonDarkholme/yats.vim',
    'maxmellon/vim-jsx-pretty',
    { 'nvim-telescope/telescope-fzf-native.nvim', build = 'make' },
    'tpope/vim-surround',
    { 'lewis6991/gitsigns.nvim', config = function() require('gitsigns').setup() end },
}
