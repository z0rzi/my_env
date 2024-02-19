return {
  "z0rzi/outline.nvim",
  config = function()
    -- Example mapping to toggle outline
    vim.keymap.set("n", "<leader>o", "<cmd>lua if require('outline').is_open() then require('outline').focus_outline() else require('outline').open() end<CR>",
      { desc = "Open Outline" })

      vim.api.nvim_command("autocmd FileType Outline nnoremap <buffer> <LEADER>o <CMD>OutlineClose<CR>")

    require("outline").setup {
      preview_window = {
        -- auto_preview = true
      },
      outline_items = {
        show_symbol_lineno = true,
        -- show_symbol_details = true
      },
      outline_window = {
        position = "left",
        width = 30,
        relative_width = false,
        show_cursorline = true,
        hide_cursor = true,
        -- focus_on_open = false
      },
      symbols = {
        filter = {
          "File",
          "Module",
          "Namespace",
          "Package",
          "Class",
          "Method",
          "Property",
          -- "Field",
          "Constructor",
          "Enum",
          "Interface",
          "Function",
          -- "Variable",
          -- "Constant",
          -- "String",
          -- "Number",
          -- "Boolean",
          -- "Array",
          -- "Object",
          -- "Key",
          -- "Null",
          -- "EnumMember",
          -- "Struct",
          -- "Event",
          -- "Operator",
          -- "TypeParameter",
          -- "Component",
          -- "Fragment",
          -- "TypeAlias",
          "Parameter",
          "StaticMethod",
          -- "Macro",
        }
      },
      symbol_folding = {
        -- To unfold all by default
        -- autofold_depth = false,
      },
    }
  end,
}
