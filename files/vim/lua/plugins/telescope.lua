return {
  'nvim-telescope/telescope.nvim',
  branch = '0.1.x',
  dependencies = {
    'nvim-lua/plenary.nvim',
    'fannheyward/telescope-coc.nvim'
  },
  extensions = {
    coc = {
      theme = 'ivy',
      prefer_locations = true, -- always use Telescope locations to preview definitions/declarations/implementations etc
    }
  },
  config = function()
    require('telescope').load_extension('coc')
    require('telescope').setup {
      defaults = {
        file_sorter = require('telescope.sorters').fuzzy_with_index_bias,
        preview = {
          filesize_limit = 0.1, -- MB
        },
        scroll_strategy = 'limit',
        layout_strategy = "flex",
        path_display = {truncate = 3},
        layout_config = {
          flex = {
            flip_columns = 200,
          },
          vertical = {
            preview_height = 0.7,
          },
        },
        mappings = {
          i = {
            ['<C-down>'] = require('telescope.actions').preview_scrolling_down,
            ['<C-up>'] = require('telescope.actions').preview_scrolling_up,
            ['<S-down>'] = require('telescope.actions').preview_scrolling_down,
            ['<S-up>'] = require('telescope.actions').preview_scrolling_up,
          },
        },
      },
    }
  end
}
