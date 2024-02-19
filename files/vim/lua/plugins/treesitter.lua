return {
    'nvim-treesitter/nvim-treesitter',
    config = function()
        -- activate highlighting of markdown blocks
        --  let g:markdown_fenced_languages = ['html', 'python', 'lua', 'vim', 'typescript', 'javascript']
        vim.g.markdown_fenced_languages = { 'html', 'python', 'lua', 'vim', 'typescript', 'javascript' }

        require('nvim-treesitter.configs').setup ({
            -- Add languages to be installed here that you want installed for treesitter
            ensure_installed = { 'c', 'cpp', 'go', 'lua', 'python', 'rust', 'typescript', 'vimdoc', 'cmake' },
        })
    end
}
