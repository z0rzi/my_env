let g:mapleader = "\<Space>"

" Disable substitution live preview
let &inccommand = ""

nnoremap <CR> %

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

" Folding
    set foldlevelstart=99
    set foldmethod=expr
    set foldexpr=FoldLevel(v:lnum)
    set foldtext=NeatFoldText()

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

nnoremap <S-right> *
nnoremap <S-left> #

autocmd filetype json nnoremap <LEADER>= :%!jq<CR>
