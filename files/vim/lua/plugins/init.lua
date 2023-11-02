return {
    -- {'z0rzi/vim-adaptive-indent', config=function() vim.cmd('autocmd BufReadPost * AdaptIndent') end },
    'z0rzi/nvim-fix-braces',
    'z0rzi/vim-zorzi-smoothie',
    'z0rzi/vim-smart-hits',
    {'z0rzi/lightline-bufferline', dependencies={'itchyny/lightline.vim',}},

    {
        'nmac427/guess-indent.nvim',
        config = function() require('guess-indent').setup {} end,
    },

    'HerringtonDarkholme/yats.vim',
    'maxmellon/vim-jsx-pretty',
    
    'tpope/vim-surround',
    {'lewis6991/gitsigns.nvim', config=function() require('gitsigns').setup() end},
}
