local function getCustomSorter()
  local sorters = require("telescope.sorters")
  local FILTERED = sorters.FILTERED
  local Sorter = require("telescope.sorters").Sorter

  local ngram_highlighter = function(ngram_len, prompt, display)
    local highlights = {}
    display = display:lower()

    for disp_index = 1, #display do
      local char = display:sub(disp_index, disp_index + ngram_len - 1)
      if prompt:find(char, 1, true) then
        table.insert(highlights, {
          start = disp_index,
          finish = disp_index + ngram_len - 1,
        })
      end
    end

    return highlights
  end

  return function(opts)
    opts = opts or {}
    opts.ngram_len = 2

    local ngram_len = opts.ngram_len or 2

    local function getCharIdxs(line, char)
      local idxs = {}
      for i = 1, #line do
        if line:sub(i, i) == char then
          table.insert(idxs, i)
        end
      end
      return idxs
    end

    local function searchPattern(prompt, line, last_stuck)
      local cara = prompt:sub(1, 1)
      local c_idxs

      if last_stuck then
        c_idxs = getCharIdxs(line, cara)
      else
        -- If first char of prompt != first char of line, we abort
        if line:sub(1, 1) ~= cara then
          return {}
        end
        -- We can directly set c_idxs in this case
        c_idxs = { 1 }
      end

      local idxs = {}
      local rest = prompt:sub(2)

      if rest == "" then
        for i = 1, #c_idxs do
          table.insert(idxs, { c_idxs[i] })
        end
      else
        for i = 1, #c_idxs do
          local idx = c_idxs[i]
          local match = { idx }

          if #rest > 0 then
            local subIdxs = searchPattern(prompt:sub(2), line:sub(idx + 1), idx == 1)
            for j = 1, #subIdxs do
              local newMatch = { unpack(match) }
              for k = 1, #subIdxs[j] do
                table.insert(newMatch, subIdxs[j][k] + idx)
              end
              table.insert(idxs, newMatch)
            end
          end
        end
      end

      return idxs
    end

    return Sorter:new {
      -- self
      -- prompt (which is the text on the line)
      -- line (entry.ordinal)
      -- entry (the whole entry)
      scoring_function = function(_, prompt, line, entry)
        -- @param prompt The prompt that the user is typing in.
        -- @param line The current line that is being evaluated.
        -- @param entry The entry that is being evaluated.
        -- @param cb_add Callback function to add a match.
        -- @param cb_filter Callback function to filter a match.

        line = line:lower()
        prompt = prompt:lower()

        local entry_index = entry.index or 0

        if prompt == "" then
          return 1
        end

        local patterns = searchPattern(prompt, line, true)

        if #patterns == 0 then
          -- No match was found
          return -1
        end

        local finalScore = 0

        local last_slash_position = line:find("/[^/]*$")

        for i = 1, #patterns do
          local pattern = patterns[i]
          -- The initial index of the entry matters
          local score = 100 - entry_index / 50
          local lastIdx = 0

          local first_letter_pos = pattern[1]
          local char_before_first_letter = line:sub(first_letter_pos - 1, first_letter_pos - 1)

          if first_letter_pos > last_slash_position then
            -- The whole prompt matches a file name,
            -- we like that.
            score = score + 100
          end

          if char_before_first_letter == "/" then
            -- If the first letter is preceded by a slash,
            -- the user is probably writing a file/folder name,
            -- so we give it a boost
            score = score + 100
          end

          for j = 1, #pattern do
            local idx = pattern[j]
            -- consecutive matches are better
            if idx - lastIdx == 1 then
              score = score + 30
            end
            lastIdx = idx

            -- matches close to the end are better
            score = score - (#line - idx)
          end

          if score > finalScore then
            finalScore = score
          end
        end

        return 1000 - finalScore
      end,

      highlighter = opts.highlighter or function(_, prompt, display)
        return ngram_highlighter(ngram_len, prompt, display)
      end,
    }
  end
end

return {
  'nvim-telescope/telescope.nvim',
  branch = '0.1.x',
  dependencies = {
    'nvim-lua/plenary.nvim',
    'fannheyward/telescope-coc.nvim',
    'kelly-lin/telescope-ag',
  },
  extensions = {
    coc = {
      theme = 'ivy',
      prefer_locations = true, -- always use Telescope locations to preview definitions/declarations/implementations etc
    }
  },
  config = function()
    local telescope_ag = require("telescope-ag")
    telescope_ag.setup({
      cmd = { "hy", "-get-links" },
    })

    local actions = require("telescope.actions")

    require('telescope').load_extension('fzf')
    require('telescope').load_extension('coc')
    require('telescope').setup {
      defaults = {
        file_sorter = getCustomSorter(),
        preview = {
          filesize_limit = 0.1, -- MB
        },
        scroll_strategy = 'limit',
        layout_strategy = "vertical",
        path_display = { truncate = 3 },
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
            ["<esc>"] = actions.close,
            ["<C-j>"] = actions.move_selection_next,
            ["<C-k>"] = actions.move_selection_previous,
            ["<C-t>"] = actions.select_tab,
            ["<C-u>"] = actions.preview_scrolling_up,
            ["<C-d>"] = actions.preview_scrolling_down,
            ["<C-c>"] = actions.close,
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
