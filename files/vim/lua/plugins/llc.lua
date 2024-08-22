return {
    'github/copilot.vim',
    init = function()
        vim.g['copilot_no_tab_map'] = true
        -- vim.api.nvim_set_keymap('i', '<C-\\>', 'copilot#Accept("")', { expr = true, silent = true })
        vim.api.nvim_set_keymap('i', '<A-\\>', '<CMD>Copilot panel<CR>', { silent = true })
        vim.cmd('highlight CopilotSuggestion guifg=#444444')
    end
}

-- return {
--     'Exafunction/codeium.vim',
--     dependencies = {
--         "nvim-lua/plenary.nvim",
--         "hrsh7th/nvim-cmp",
--     },
--     event = 'BufEnter',
--     init = function()
--         vim.g['codeium_disable_bindings'] = true
--         vim.cmd('highlight CodeiumSuggestion guifg=#444444')
--
--         vim.keymap.set('i', '<C-l>', function() return vim.fn['codeium#Accept']() end, { expr = true, silent = true })
--         vim.keymap.set('i', '<c-;>', function() return vim.fn['codeium#CycleCompletions'](1) end,
--             { expr = true, silent = true })
--     end
-- }
