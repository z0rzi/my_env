-- return {
--     'codota/tabnine-nvim',
--     build = "./dl_binaries.sh",
--     config = function()
--         require('tabnine').setup({
--             disable_auto_comment=true,
--             accept_keymap="<C-\\>",
--             dismiss_keymap = "<C-]>",
--             debounce_ms = 800,
--             suggestion_color = {gui = "#808080", cterm = 244},
--             exclude_filetypes = {"TelescopePrompt", "NvimTree"},
--             log_file_path = nil, -- absolute path to Tabnine log file
--         })
--     end
-- }

return {
    'github/copilot.vim',
    init = function()
        vim.g['copilot_no_tab_map'] = true
        -- vim.api.nvim_set_keymap('i', '<C-\\>', 'copilot#Accept("")', { expr = true, silent = true })
        vim.api.nvim_set_keymap('i', '<A-\\>', '<CMD>Copilot panel<CR>', { silent = true })
        vim.cmd('highlight CopilotSuggestion guifg=#444444')
    end
}
