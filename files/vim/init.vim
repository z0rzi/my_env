" 
" GENERAL NATIVE VIM SETTINGS
" 
    syn on
    filetype on
    set nu
    set nosol
    set wrap
    set linebreak
    set breakindent
    set ruler
    set hidden
    set showtabline=2  " always show tabline
    set nobackup
    set nowritebackup
    set updatetime=1000
    set shortmess+=c
    set diffopt=context:15
    set diffopt+=iblank
    set diffopt+=iwhite
    set diffopt+=internal
    set diffopt+=algorithm:minimal
    set diffopt+=indent-heuristic
    set diffopt+=filler
    set diffopt+=vertical
    set signcolumn=yes
    set termguicolors  " Increases the saturation
    set previewheight=5

    set iskeyword+=-

    set smartindent
    set autoindent
    set tabstop=4 shiftwidth=4 expandtab

    set scrolloff=5

    set conceallevel=2
    set mouse=a

    set formatoptions=cro
    set clipboard=unnamedplus

    set swapfile
    set dir=/tmp
    set modeline

    " to refresh file automatically if updated
        set autoread

    " change the leader key to <space>
        let g:mapleader = "\<Space>"

    " Don't conceal markdown
        let g:vim_markdown_conceal_code_blocks=0
        let g:vim_markdown_conceal=0


" 
" LOOKS AND FEEL
" 
    " General
        colorscheme gruvbox
        set fillchars=stl:\ ,stlnc:=,vert:│,fold:\ ,diff:-
        set listchars=tab:.\ , list

    " Folding
        set foldlevelstart=99
        set foldmethod=expr
        set foldexpr=FoldLevel(v:lnum)
        set foldtext=NeatFoldText()

    " GruvBox config
        let g:gruvbox_italic = 1
        let g:gruvbox_undercurl = 1
        let g:gruvbox_termcolors = 256
        let g:gruvbox_contrast_dark = "medium"
        let g:gruvbox_italicize_strings = 1
        let g:gruvbox_invert_selection = 0
        let g:gruvbox_invert_signs = 0  " for GitGutter signs
        let g:gruvbox_guisp_fallback = 'bg'

    " GVim
        set guioptions-=m  "remove menu bar
        set guioptions-=T  "remove toolbar
        set guioptions-=r  "remove right-hand scroll bar
        set guioptions-=L  "remove left-hand scroll bar
        set background=dark

    " language specific
        " python
            " let g:python_highlight_all
            let g:python_highlight_builtin_funcs=1
            let g:python_highlight_builtin_objs=1
            let g:python_highlight_builtins=1
            let g:python_highlight_doctests=1
            let g:python_highlight_exceptions=1
            let g:python_highlight_file_headers_as_comments=1
            let g:python_highlight_indent_errors=0
            let g:python_highlight_space_errors=0
            let g:python_highlight_string_format=1
            let g:python_highlight_string_formatting=1
            let g:python_highlight_string_templates=1
            let g:python_print_as_function=1
            let g:python_slow_sync=0
            let g:python_version_2=0

"
" KeyBindings
"
    nmap <A-x> <ESC>
    nmap <A-z> <ESC>
    nnoremap >> i<C-t><ESC>
    inoremap << <<
    inoremap <<SPACE> <<SPACE>
    nnoremap Y y$
    nnoremap z<RIGHT> $
    nnoremap z<LEFT> ^
    nnoremap YY <CMD>let v = winsaveview()<CR>ggyG<CMD>call winrestview(v)<CR>
    nnoremap VV ggVG
    nnoremap vv v$h
    nnoremap <CR> %
    onoremap <CR> v%
    inoremap <F2> <ESC>
    inoremap <C-x><C-l> <C-x><C-l>
    inoremap <silent> <C-r>/ <C-r>=substitute(@/, '\\.', '', 'g')<CR>
    inoremap <LEFT> <C-G>U<LEFT>
    inoremap <RIGHT> <C-G>U<RIGHT>
    inoremap <DOWN> <C-G>U<DOWN>
    inoremap <UP> <C-G>U<UP>

    nnoremap <LEADER>/ /\<\><LEFT><LEFT>
    nnoremap <LEADER>a ea
    nnoremap <LEADER>i bi
    nnoremap <CS-DOWN> <C-v>j
    nnoremap <CS-UP> <C-v>k
    xnoremap <CS-DOWN> j
    xnoremap <CS-UP> k

    xnoremap <CR> <CMD>if mode() == 'V' <BAR> call search('\%#.*\zs\([{[(][;:.,\\]*\<BAR>\/\*\+\)$') <BAR> endif<CR>%

    xnoremap p <CMD>let save=@0<CR>p<CMD>let [@0, @", @+] = [save, save, save]<CR>
    xnoremap $ $h
    xnoremap " "rc"<C-r>r"<ESC>gvlolo
    xnoremap ' "rc'<C-r>r'<ESC>gvlolo
    nnoremap - 2<C-y><C-g>
    nnoremap + 2<C-e><C-g>
    xnoremap g= c<C-r>=<C-r>+<CR><ESC>
    nnoremap g= Vc<C-r>=<C-r>+<CR><ESC>
    inoremap \'e é

    nnoremap <C-right> e
    nnoremap <C-left> b

    nnoremap <C-down> <CMD>m+1<CR>
    nnoremap <C-up> <CMD>m-2<CR>
    xnoremap <C-up> :<C-u>exe (line("'<")-1) . " m " . line("'>")<CR>gv
    xnoremap <C-down> :<C-u>exe (line("'>")+1) . " m " . (line("'<") - 1)<CR>gv
    xnoremap <C-right> dpgvlolo
    xnoremap <C-left> dhPgvhoho

    nmap <LEADER>* :call TsDocFunc()<CR>

    " nnoremap <F3> :set hlsearch!<CR>
    nnoremap <F3> <CMD>noh<CR>
    " Plugin: GitGutter
    nmap <F5> <CMD>redraw!<CR><CMD>set foldmethod=expr<CR><CMD>GuessIndent<CR>

    " Duplicate lines
        function! DuplicateLines(type, ...)
            if a:0
                " We're in visual mode
                if visualmode() == 'v'
                    exe 'normal! "my"mPgv'
                else
                    exe "normal! :co '<-1\<CR>gv"
                endif
            else
                '[,'] copy '[-1
                call setpos('.', [0, line("']")+1, 1000, 0])
            endif
        endfunction
        nnoremap <silent> Z <CMD>set opfunc=DuplicateLines<CR>g@
        xnoremap <silent> Z  <CMD>call DuplicateLines(visualmode(), 1)<CR>
        nnoremap <silent> ZZ <CMD>co +0<CR>
        nnoremap <silent> zx <CMD>co +0<CR>

    " Easy search n replace
        nnoremap <C-c> <CMD>if CursorOnMatch(@/) <BAR> exe "norm!lN" <BAR> else <BAR> let @/="\\<".expand("<cword>")."\\>" <BAR> endif<CR>cgn
        nnoremap <C-d> <CMD>if CursorOnMatch(@/) <BAR> exe "norm!lN" <BAR> else <BAR> let @/="\\<".expand("<cword>")."\\>" <BAR> endif<CR>dgn

    " Cool selection stuff
        xnoremap <C-c> "ay:let @/ = SelectionToRx(@a) <BAR> call histadd('/', @/) <BAR> set hlsearch <CR>cgn
        function! ToNextOccurence(backward)
            if mode() == 'n'
                call RestrictSearch(0)
                if ! CursorOnMatch(@/)
                    let @/ = '\<'.expand('<cword>').'\>'
                endif
                if a:backward | call search(@/, 'bc') | endif
            else
                norm! "ay
                let @/ = SelectionToRx(@a)
            endif
            let @/ = @/
            let flags = ''
            " if !exists('s:minimap_search') | let s:minimap_search = '' | endif
            " if s:minimap_search != @/
            "     let s:minimap_search = @/
            "     call minimap#vim#HighlightSearch()
            " endif
            if a:backward | let flags .= 'b' | endif
            call search(@/, flags)
            call histadd('/', @/)
        endfunction
        xnoremap <S-LEFT> <CMD>call ToNextOccurence(1) <BAR> set hlsearch<CR>
        xnoremap <S-RIGHT> <CMD>call ToNextOccurence(0) <BAR> set hlsearch<CR>
        nnoremap <silent> <S-LEFT> <CMD>call ToNextOccurence(1) <BAR> set hlsearch<CR>
        nnoremap <silent> <S-RIGHT> <CMD>call ToNextOccurence(0) <BAR> set hlsearch<CR>
        xnoremap # <CMD>call ToNextOccurence(1) <BAR> set hlsearch<CR>
        xnoremap * <CMD>call ToNextOccurence(0) <BAR> set hlsearch<CR>
        nmap <CS-Right> <CMD>call RestrictSearch(1)<CR>
        nmap <CS-Left> <CMD>call RestrictSearch(-1)<CR>


" 
" PLUGINS CONFIG
" 
    " smartHits
        let g:smartHits_should_setup_maps = 0

        inoremap <silent> <SPACE> <C-r>=smartHits#smartSpace()<CR>
        inoremap <silent> <CR> <C-r>=smartHits#smartCR()<CR>
        inoremap <silent> <BS> <C-r>=smartHits#smartBS()<CR>
        inoremap <silent> <C-]> <C-r>=smartHits#skip()<CR>
        inoremap <silent> <CS-]> <C-r>=smartHits#sendToEol()<CR>

        let g:smartHits_pairs = [
            \ ['(', ')'],
            \ ['[', ']'],
            \ ['{', '}'],
            \ ['<', '>'],
            \ ['/**', '*/'],
            \ ['''', ''''],
            \ ['"', '"'],
            \ ['```', '```'],
            \ ]

        function! TsLog()
            if exists('b:coc_current_function') && b:coc_current_function != ''
                return b:coc_current_function . ':' . string(line('.')) . '\t>'
            endif
            " Returning the file name without the extension
            return expand('%:t:r') . ':' . string(line('.')) . '\t>'
        endfunction

        " ^ at start of lhs to only work if match at start of line
        " $ at end of lhs to only work if match at end of line
        " \(...\) in lhs, and $1 in rhs to repeat capture or $& to repeat full match
        let g:smartHits_abbrevs = {
            \   'vim': {
            \     '^l': "let",
            \     '^log': "echom",
            \   },
            \   'sh': {
            \     '^log': "echo $!",
            \   },
            \   'html': {
            \     '^\%(div\|span\|table\|h\d\)$': "<$&></$&>\<C-o>F<!",
            \     '^\.\.\([[:alnum:]-]\+\)$': "<div class=\"$1\"></div>\<C-o>F<!",
            \     '\[\([[:alnum:]-]\+\)\]\@=': "\<DEL>[$1]=\"\"\<LEFT>!",
            \   },
            \   'javascript': {
            \     'l': "let",
            \     'c': "const",
            \     'func': "function",
            \     '^log': "console.log('\<C-r>=TsLog()\<CR>', );\<LEFT>\<LEFT>!",
            \     'import \(cors\|express\|fs\|path\)': "import $1 from '$1';!",
            \     'import \(\w*\) ': "import $1 from '$1';!",
            \     '^\(if\|for\)$': "$1 ()\<LEFT>!",
            \     '^iff': "if () {\<CR>}<UP><ESC>f(a!",
            \     '^fori': "for (let i=0; i < .length ; i++)\<ESC>F.i!",
            \     '\%(for\s*([^)]*\)\@<=in': "of",
            \     'if\s*(!\([^)]* in\)': "if (!($1)<\LEFT>",
            \     'if\s*(\([^)]*\)not in': "if (!($1)<\LEFT>in",
            \     'if\s*(!\([^)]*instanceof\)': "if (!($1)<\LEFT>",
            \     'if\s*(\([^)]*\)not instanceof': "if (!($1)<\LEFT>instanceof",
            \     '\%(\[[^\]]*\)\@<=\s*=': "\<ESC>F[f]a = !",
            \     '^\(if\|for\|while\|switch\)\s\+\([^([:blank:]][^(]\+\)': "$1 ($2)\<LEFT>",
            \     'prom': "new Promise((resolve, reject) => {})\<LEFT>\<LEFT>!",
            \     '^ret': "return",
            \     ')\s*ret': ") return",
            \     'req$': "require('')\<LEFT>\<LEFT>!",
            \     'aw': "await",
            \     '^ii': "if(  )\<LEFT>\<LEFT>!",
            \     'ff': "\<ESC>:if match(getline(line('.')), ')$') != -1 \<BAR> call setline('.', getline('.') . ';') \<BAR> endif\<CR>a() => {\<CR>}\<C-o>O!",
            \     '^tryc$': "try {\<ESC>:call SmartJumpToEnd()\<CR>a} catch (err) {\<CR>}\<C-o>O\<SPACE>\<BS>\<C-o>z"
            \   },
            \   'javascriptreact': {
            \     '@inherit': 'javascript',
            \   },
            \   'typescriptreact': {
            \     '@inherit': 'javascriptreact typescript',
            \   },
            \   'typescript': {
            \     '@inherit': 'javascript',
            \     'ro': "readonly",
            \     '^Inp': "@Input() attr: string;\<ESC>Fave\<C-g>!",
            \     '^Out': "@Output() attr: EventEmitter<string> = new EventEmitter<string>();\<ESC>^fave\<C-g>!",
            \     'pub': "public",
            \     'pri': "private",
            \   },
            \   'vue': {
            \     '@inherit': 'typescript',
            \   },
            \   'sql': {
            \     'sel': 'SELECT * FROM',
            \     'upd': 'UPDATE tbl SET row = ""',
            \     'del': 'DELETE FROM',
            \   },
            \   'python': {
            \     '^tryc$': "try:\<ESC>:call SmartJumpToEnd()\<CR>aexcept:\<CR>pass\<C-o>O\<SPACE>\<BS>\<C-o>z",
            \     '^log': "print()\<LEFT>!",
            \     '^print': "print()\<LEFT>!",
            \   },
            \ }

    " indentLine
        let g:indentLine_char = '┆'

    " Vim LightLine
        let g:lightline = {
            \ 'colorscheme': 'powerline',
            \ 'active': {
            \   'left':[ [ 'mode', 'paste' ],
            \            [ 'gitbranch', 'readonly', 'filename', 'modified' ]
            \   ]
            \ },
            \ 'tabline': {
            \   'left': [ ['buffers'] ],
            \   'right': [ [ 'close' ], ],
            \ },
            \ 'component_expand': {
            \   'buffers': 'lightline#bufferline#buffers'
            \ },
            \ 'component_type': {
            \   'buffers': 'tabsel'
            \ },
            \ 'component': {
            \   'separator': '',
            \   'lineinfo': ' %3l:%-2v',
            \ },
        \ }

        let g:lightline.component_raw = {'buffers': 1}
        let g:lightline#bufferline#enable_devicons = 1
        let g:lightline#bufferline#clickable = 1
        let g:lightline#bufferline#modified = ' ●'
        " let g:lightline#bufferline#reverse_buffers = 1

        let g:lightline.separator = {
            \   'left': '', 'right': ''
          \}
        let g:lightline.subseparator = {
            \   'left': '', 'right': '' 
          \}

        nnoremap <Tab> <CMD>call lightline#bufferline#next()<CR>
        nnoremap <S-Tab> <CMD>call lightline#bufferline#prev()<CR>
        nnoremap <LEADER>q <CMD>call lightline#bufferline#remove()<CR>
        nnoremap <silent> <leader><leader> :call lightline#bufferline#add_buff_to_tabs(bufnr()) <BAR> call lightline#bufferline#buffers()<CR>

    " Telescope
        nnoremap <C-p> <CMD>Telescope find_files find_command=listfiles.sh<CR>
        nnoremap <CS-p> <CMD>Telescope find_files find_command=hy,-get-links<CR>
        nnoremap <CA-p> :Telescope find_files find_command=listfiles.sh,<C-r>=expand('%:h')<CR><CR>
        nnoremap <C-f> <CMD>Telescope live_grep<CR>
        nnoremap <C-s> :Telescope grep_string search=<C-r>=expand('<cword>')<CR> word_match=-w<CR>
        

    " GIT
        nmap <leader>gn <CMD>Gitsigns next_hunk<CR>
        nmap <leader>gp <CMD>Gitsigns prev_hunk<CR>
        nmap <leader>g<DOWN> <CMD>Gitsigns next_hunk<CR>
        nmap <leader>g<UP> <CMD>Gitsigns prev_hunk<CR>
        nmap <leader>gu <CMD>Gitsigns reset_hunk<CR>
        nmap <leader>gv <CMD>Gitsigns select_hunk<CR>
        nmap <leader>ga <CMD>Gitsigns add_hunk<CR>
        nmap <leader>gb <CMD>Gitsigns blame_line<CR>
        nmap <leader>gP <CMD>Gitsigns preview_hunk<CR>
        nmap <leader>gs <CMD>Gitsigns diffthis<CR>

    " Comments
        nnoremap <C-/> <CMD>CommentToggle<CR>
        inoremap <C-/> <CMD>CommentToggle<CR>
        xnoremap <C-/> :CommentToggle<CR>gv

    " Copilot
        inoremap <C-\> <CMD>call setpos("'[", getpos('.'))<CR><C-r>=copilot#Accept("")<CR><CMD>FixBraces<CR>
   
    " Coc
        " Tab to go through completion list
            function! CheckBackspace() abort
                let col = col('.') - 1
                return !col || getline('.')[col - 1]  =~# '\s'
            endfunction
            inoremap <silent><expr> <TAB>
                  \ coc#pum#visible() ? coc#pum#next(1) :
                  \ CheckBackspace() ? "\<TAB>" :
                  \ coc#refresh()
            inoremap <expr><S-TAB> coc#pum#visible() ? coc#pum#prev(1) : coc#refresh()

        " Use <C-space> to expand
            inoremap <silent><expr> <c-SPACE> coc#pum#visible() ? coc#pum#confirm() : coc#refresh

        hi FgCocErrorFloatBgCocFloating ctermfg=1 ctermbg=239 guifg=#ff947c guibg=NONE

        function! ShowDocumentation()
          if CocAction('hasProvider', 'hover')
            call CocActionAsync('doHover')
          else
            call feedkeys('K', 'in')
          endif
        endfunction
        nnoremap <silent> <F1> :call ShowDocumentation()<CR>
        inoremap <silent> <F1> <CMD>call CocActionAsync('showSignatureHelp')<CR>

        nmap <leader>xp <Plug>(coc-diagnostic-prev)
        nmap <leader>xn <Plug>(coc-diagnostic-next)
        nmap <leader>x<UP> <Plug>(coc-diagnostic-prev)
        nmap <leader>x<DOWN> <Plug>(coc-diagnostic-next)
        nmap <silent> <leader>x<RIGHT> :execute 'CocNext' <BAR> execute 'redraw!'<CR>
        nmap <silent> <leader>x<LEFT> :execute 'CocPrev' <BAR> execute 'redraw!'<CR>
        nmap <leader>xF <Plug>(coc-fix-current)
        nmap <leader>xf <CMD>let _a = expand('<cword>')<BAR>Telescope live_grep<CR>export .*\b<C-r>=_a<CR>\b
        nmap <silent> <F12> <CMD>Telescope coc references<CR>
        nmap <silent> <C-]> <CMD>Telescope coc definitions<CR>
        nmap <leader>xl <Plug>(coc-codelens-action)
        nmap <leader>xd <Plug>(coc-type-definition)
        nmap <leader>xe <Plug>(coc-codeaction-refactor)
        nmap <leader>xc <Plug>(coc-codelens-action)
        nmap <leader>x<space> <CMD>CocCommand<CR>
        nmap <leader>xr <Plug>(coc-rename)
        nmap <leader>xq <CMD>call CocActionAsync('runCommand', 'editor.action.organizeImport')<CR>
        nmap <leader>xx <CMD>CocList diagnostics<CR>

        nmap <leader>= :call CocAction('format')<CR>
        xmap <leader>= <Plug>(coc-format-selected)

" 
" FUNCTIONS
" 
    function! GetSynName()
        if !exists("*synstack" )
            return
        endif
        echo map(synstack(line('.'), col('.')), 'synIDattr(v:val, "name" )')
    endfunction

    function! TsDocFunc()
        " Going after the parenthesis
        norm ^ma%

        " Going at the opening bracket
        call search('{', 'c')

        " Looking for the end of the function
        let [endline, endcol] = searchpairpos('{', '', '}', 'n')

        call setpos('.', getpos("'a"))

        let text = ''
        let line = line('.')

        while line < endline
            let text = text . '\n' . getline(line)
            let line += 1
        endwhile

        let @+ = text

        call system('node /home/zorzi/.my_env/scripts/js-comment-function.js')

        sleep 100m

        call setpos('.', getpos("'a"))
        norm "+P
    endfunction

    function! ComparePositions(p1, p2)
        let linediff = a:p2[0] - a:p1[0]
        let coldiff = a:p2[1] - a:p1[1]
        return linediff + (!linediff) * coldiff
    endfunction

    function! CursorOnMatch(searchPattern)
        " checks whether a cursor is on a match or not
        let position = getcurpos()[1:2]
        let curpos = getpos('.')
        call setpos('.', [0] + position + [0])

        let pos = searchpos(a:searchPattern, 'ec')

        if pos == [0,0] || ComparePositions(position, pos) < 0
            call setpos('.', curpos)
            return 0
        endif


        let pos = searchpos(a:searchPattern, 'bnc')

        if pos == [0,0] || ComparePositions(pos, position) < 0
            call setpos('.', curpos)
            return 0
        endif

        call setpos('.', curpos)
        return 1
    endfunction

    function! RestrictSearch(flag)
        " Restricts the current search to only the n following / preceeding
        " lines
        let cursearch = @/
        let save = winsaveview()

        " let cara = matchstr( a:line, '\S\ze\s' )
        let start = matchstr(cursearch, '\\%>\zs\d\+\zel')
        let end = matchstr(cursearch, '\\%<\zs\d\+\zel')
        let search = substitute(cursearch, '\\%[<>]\d\+l', '', 'g')

        if a:flag == 0
            let @/ = search
            return
        endif

        if a:flag < 0
            if !end
                let end = line('.') + 1
            endif
            if start
                call setpos('.', [0, start + 1, 0, 0])
            endif
            call search(search, 'bW')
            let start = line('.') - 1
        else
            if !start
                let start = line('.') - 1
            endif
            if end
                call setpos('.', [0, end, 0, 0])
            endif
            call search(search, 'W')
            let end = line('.') + 1
        endif

        call winrestview(save)

        let @/ = '\%>'.start.'l\%<'.end.'l'.search
        " call histadd('/', @/)
    endfunction

    function! FoldLevel(lnum)
        return indent(nextnonblank(a:lnum)) / getbufvar('.', '&tabstop', 1)
    endfunction

    function! NeatFoldText()
        let foldchar         = matchstr(&fillchars, 'fold:\zs.')
        let lines_count      = v:foldend - v:foldstart + 1
        let lines_count_text = printf("┈─ %1s lines ─┈", lines_count) . repeat(foldchar, 10)
        let foldtextstart    = repeat(' ', indent(nextnonblank(v:foldstart))) . " ••• " 
        let foldtextend      = lines_count_text . repeat(foldchar, 8)
        let foldtextlength   = strlen(substitute(foldtextstart . foldtextend, '.', 'x', 'g')) + &foldcolumn

        return foldtextstart . repeat(foldchar, winwidth(0) - foldtextlength) . foldtextend
    endfunction

    " Open Ranger
        function! OpenRanger()
            let dir = expand('%:p:h')
            let copy_save = @+
            let enter_cmd = "eval fm.move(right=1) if fm.thisfile.is_directory else fm.execute_console(\\'chain shell -f bash -c \"realpath \\\%f | xclip -sel clip\"; quit\\')"
            let cmd =
                        \ "!kitty --title floating" .
                        \ " -o remember_window_size=no -o initial_window_height=500 -o initial_window_width=1000" .
                        \ " ranger" .
                        \ " --cmd 'map <CR> ".enter_cmd."'" .
                        \ " --cmd 'map <RIGHT> ".enter_cmd."'" .
                        \ " --cmd 'map q eval fm.execute_console(\\'chain shell -f bash -c \"echo -n | xclip -sel clip\"; quit\\')'" .
                        \ " " . dir

            sil! exe cmd
            sleep 50m
            if filereadable(trim(@+))
                exe "e " . trim(@+)
                let @+ = copy_save
            endif
        endfunction
        nnoremap <LEADER>;i <CMD>call OpenRanger()<CR>
        nnoremap <F2> <CMD>call OpenRanger()<CR>

    " go to end of indent
        function! IndentJump(direction)
            let curline = line('.')
            " let indent = matchstr(getline(curline), '^\s*')
            let indent = indent(curline)
            if a:direction >= 0
                " let nextLineNum = search('^.*\S.*$', 'n')
                let nextLineNum = nextnonblank(line('.')+1)
            else
                " let nextLineNum = search('^.*\S.*\n\_.*\%#', 'nb')
                let nextLineNum = prevnonblank(line('.')-1)
            endif
            " let nextIndent = matchstr(getline(nextLineNum), '^\s*')
            let nextIndent = indent(nextLineNum)

            if nextIndent < indent || indent == 0
                if a:direction >= 0
                    let flag = ''
                else
                    let flag = 'b'
                endif
                call search('^.*\S.*\zs$', flag)
            else
                if a:direction >= 0
                    " call search('^\('.indent.'\).*\n\(\1.*\n\|\s*\n\)*\1.*\zs')
                    call search('[\n[:blank:]]*\n\%\( \)\{,'.(indent-1).'}\S')
                else
                    " call search('^\('.indent.'\)\S.*\zs\ze\n\(\1.*\n\|\s*\n\)*.*\%#')
                    call search('^\%\( \)\{,'.(indent-1).'}\S.*\n[\n[:blank:]]*.*\zs', 'b')
                endif
            endif
        endfunction
        noremap <S-UP> <CMD>call IndentJump(-1)<CR>
        noremap <S-DOWN> <CMD>call IndentJump(1)<CR>
        nnoremap z<UP> <CMD>call IndentJump(-1)<CR>
        nnoremap z<DOWN> <CMD>call IndentJump(1)<CR>

    " Init folds
        function! FoldIfMakeSense(offset)
            let line = line('.') + matchstr(a:offset, '-\?\d*$')
            let foldline = foldclosed(line)

            if foldline != -1
                return
            endif

            exe"".a:offset."foldclose"
        endfunction
        function! FoldAllSameLevel()
            let curpos = getcurpos()
            let saveSearch = @/
            let indent = matchstr(getline(line('.')), '^\s\+')
            exe"%g/^\\(".indent."\\s*\\S\\)\\@!\\s*\\S.*\\(\\n\\s*\\)\\+".indent."\\S/call FoldIfMakeSense('+1')"
            let @/ = saveSearch
            call setpos('.', curpos)
            noh
        endfunction
        nnoremap zff <CMD>call FoldAllSameLevel()<CR>

    " Highlight current selection
        let s:last_mode = 'n'
        let s:sel_matches = ''
        hi SelectionOthers cterm=bold,underline ctermbg=NONE ctermfg=none gui=bold,underline guibg=NONE guifg=none
        function! SelectionToRx(selText)
            return substitute(escape(a:selText, '/\\^$*.[~'), '\%(\s\|\n\)\+', '\\%(\\s\\|\\n\\)\\+', 'g')
        endfunction
        function! HighlightSel()
            sil!call matchdelete(s:sel_matches)
            sil!exe "norm!\"aygv"
            let s:sel_matches = matchadd('SelectionOthers', SelectionToRx(@a))
        endfunction
        function EnterVisual()
            aug VisualHi
                autocmd!
                autocmd CursorMoved * call HighlightSel()
            aug END
        endfunction
        function LeaveVisual()
            sil!call matchdelete(s:sel_matches)
            aug VisualHi
                autocmd!
            aug END
        endfunction
        function ModeChanged()
            let curmode = mode()
            let s:last_mode = curmode

            if curmode == 'v'     | call EnterVisual()
            elseif curmode == 'n' | call LeaveVisual()
            endif
        endfunction
        autocmd CursorMoved * if mode() != s:last_mode | call ModeChanged() | endif

    " Save current view settings on a per-window, per-buffer basis.
        function! AutoSaveWinView()
            if !exists("w:SavedBufView")
                let w:SavedBufView = {}
            endif
            let w:SavedBufView[bufnr("%")] = winsaveview()
        endfunction
        " Restore current view settings.
        function! AutoRestoreWinView()
            let buf = bufnr("%")
            if exists("w:SavedBufView") && has_key(w:SavedBufView, buf)
                let v = winsaveview()
                let atStartOfFile = v.lnum == 1 && v.col == 0
                if atStartOfFile && !&diff
                    call winrestview(w:SavedBufView[buf])
                endif
                unlet w:SavedBufView[buf]
            endif
        endfunction

        autocmd BufReadPost * silent!norm!g;
        autocmd BufLeave * call AutoSaveWinView()
        autocmd BufEnter * call AutoRestoreWinView()

    " Do at each 
        function! DoAtEach(macro, range)
            " Execute the given keystrokes to each occurence of a search, or at
            " each line if in select mode
            let save = winsaveview()
            let count = 0
            let searchSave = @/
            let selSave = [ getpos("'<"), getpos("'>") ]
            if a:range < 0
                " Match mode
                call setpos('.', [0, 1, 1, 0])

                " Counting number of matches
                let matchnr = 0
                while search(@/, 'W') | let matchnr += 1 | endwhile
                call setpos('.', [0, 1, 1, 0])
                call search(@/, 'W')
                exe "norm!\<BS>"
                let @/ = substitute(@/, '\\%[<>]\d\+l', '', 'g')
                let searchSave = @/

                while search(@/, 'c') && matchnr > 0
                    exe "exe \"norm! " . substitute(substitute(a:macro, '<>', '\<ESC>', 'g'), '<[a-zA-Z-]\+>\|"', '\\&', 'gi') . '"'

                    let @/ = searchSave
                    call setpos("'<", selSave[0])
                    call setpos("'>", selSave[1])

                    let matchnr -= 1
                endwhile
            else
                " Visual Mode
                call setpos('.', getpos("'<"))
                let botline = line("'>")
                while line('.') <= botline

                    let col = col('.')
                    exe "exe \"norm! " . substitute(substitute(a:macro, '<>', '\<ESC>', 'g'), '<[a-zA-Z-]\+>\|"', '\\&', 'gi') . '"'
                    if line('.') == line('$')
                        break
                    endif
                    call setpos('.', [0, line('.')+1, col, 0])
                    " norm!j

                    let @/ = searchSave
                    call setpos("'<", selSave[0])
                    call setpos("'>", selSave[1])

                    let count += 1
                    if count > 10000
                        break
                    endif
                endwhile
                " norm!gv
            endif

            call winrestview(save)
        endfunction
        noremap M :M<SPACE>
        command! -range -nargs=+  M call DoAtEach(<q-args>, '<count>')

    " Handle signals (open errors)
        function! ParseErrorLine(errLine)
            let data = split(a:errLine, ':')
            let filename = remove(data, 0)
            if len(data) > 0
                let line = remove(data, 0)
            else
                let line = 1
            endif
            if len(data) > 0
                let column = remove(data, 0)
            else
                let column = 1
            endif
            exe "edit ".filename
            call cursor(line, column)
            filetype detect
            redraw!
        endfunction
        function! HandleSig()
            let errFile = system('cat /tmp/vim_sig.txt')
            if v:shell_error != 0 | return | endif
            let errFile = trim(errFile)
            echom errFile
            call ParseErrorLine(errFile)
        endfunction
        autocmd Signal SIGUSR1 call HandleSig()
        autocmd FocusGained * call HandleSig()

    " Swaping between .ts and .html in angular settings
        function! AngularHtmlGotoImplementation()
            let word_under_cursor = expand('<cword>')
            let saveview = winsaveview()

            if search('</\?[a-zA_Z-]*\%#', 'n')
                " Cursor on xml anchor
                " exe "Telescope grep_string search='".word_under_cursor."'"
                Telescope live_grep
                exe 'norm! iselector:.*\b'.word_under_cursor.'\b'
                return
            endif

            let path = expand('%:h')
            let html_file = expand('%:t')

            if match(html_file, '\.html$') < 0
                " not an HTML file
                return
            endif

            let script_file = ''
            let extensions = ['ts', 'js']
            for ext in extensions
                let script_file = matchstr(html_file, '^.*\.') . ext
                if filereadable(path . '/' . script_file)
                    break
                endif
            endfor
            if ! filereadable(path . '/' . script_file)
                return
            endif

            exe 'e ' . path . '/' . script_file

            call cursor(1, 1)

            if
                \ search('\<\%(private\|public\|get\|set\)\s\+\zs' . word_under_cursor . '\>') ||
                \ search('\s\zs' . word_under_cursor . '\>') ||
                \ search('\<' . word_under_cursor . '\>')
                return
            endif

            " Nothing found...
            exe 'e ' . path . '/' . html_file
            call winrestview(saveview)
        endfunction
        autocmd! FileType html nnoremap <buffer> <C-]> <CMD>call AngularHtmlGotoImplementation()<CR>

        function! AngularSwitchFile()
            let path = expand('%:h')
            let current_file = expand('%:t')

            let other_file = ''
            if match(current_file, '\.html$') >= 1
                let extensions = ['ts', 'js']
            else
                let extensions = ['html', 'htm']
            endif

            for ext in extensions
                let other_file = matchstr(current_file, '^.*\.') . ext
                if filereadable(path . '/' . other_file)
                    break
                endif
            endfor
            if ! filereadable(path . '/' . other_file)
                let other_file = matchstr(current_file, '^.*\.') . extensions[0]
            endif

            return path . '/' . other_file
        endfunction
        autocmd! BufEnter *html,*ts,*js,*css nnoremap <buffer> <LEADER>w <CMD>exec "e " . AngularSwitchFile()<CR>

autocmd BufEnter *.json set filetype=jsonc
autocmd BufEnter *.json nnoremap <buffer> <LEADER>= :%!jq .<CR>

function! RunAutocmdOnce(autocmd, command)
    " Run an autocmd only once
    exe 'autocmd! ' . a:autocmd ' * ++once ' . a:command
endfunction

autocmd BufEnter * call RunAutocmdOnce("CursorMoved", 'GuessIndent')
" autocmd InsertEnter * echom 'HELLO'

if v:version <= 800
    finish
endif

" Loading Lua config
lua require("init")
