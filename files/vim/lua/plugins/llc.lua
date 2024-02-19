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
-- return {
--     'zbirenbaum/copilot.lua',
--     cmd = "Copilot",
--     event = "InsertEnter",
--     config = function()
--         require("copilot").setup({
--             panel = {
--                 enabled = false,
--                 auto_refresh = true,
--                 keymap = {
--                     jump_prev = "[[",
--                     jump_next = "]]",
--                     accept = "<CR>",
--                     refresh = "gr",
--                     open = "<M-CR>"
--                 },
--                 layout = {
--                     position = "right", -- | top | left | right
--                     ratio = 0.4
--                 },
--             },
--             suggestion = {
--                 enabled = true,
--                 auto_trigger = true,
--                 debounce = 75,
--                 keymap = {
--                     accept = "<C-l>",
--                     accept_word = "<C-k>",
--                     accept_line = false,
--                     next = "<M-]>",
--                     prev = "<M-[>",
--                     dismiss = "<C-]>",
--                 },
--             },
--             filetypes = {
--                 yaml = false,
--                 markdown = false,
--                 help = false,
--                 gitcommit = false,
--                 gitrebase = false,
--                 hgcommit = false,
--                 svn = false,
--                 cvs = false,
--                 ["."] = false,
--             },
--             copilot_node_command = 'node',   -- Node.js version must be > 18.x
--             server_opts_overrides = {},
--         })
--
--         vim.api.nvim_create_autocmd({'ModeChanged'}, {
--             pattern = { '*' },
--             callback = function()
--                 require("copilot.suggestion").next()
--             end
--         })
--         -- vim.cmd('autocmd ModeChanged * if mode() == "i" | lua require("copilot.suggestion").next() | endif')
--
--         vim.cmd('highlight CopilotSuggestion guifg=#444444')
--     end,
-- }
