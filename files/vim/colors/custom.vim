" Vim color file
" Maintainer:	Me
" Last Change:	Now

hi clear

hi Normal cterm=none ctermbg=none ctermfg=none gui=none guibg=#333333 guifg=#cccccc

let g:colors_name = "custom"

" Note: we never set 'term' because the defaults for B&W terminals are OK
hi DiffAdd      cterm=None    ctermbg=LightBlue ctermfg=None
hi DiffChange   cterm=Bold    ctermbg=4         ctermfg=10
hi DiffDelete   cterm=None    ctermbg=LightCyan ctermfg=Blue
hi DiffText     cterm=None    ctermbg=Red       ctermfg=None
hi Directory    cterm=None    ctermbg=None      ctermfg=DarkBlue
hi ErrorMsg     cterm=None    ctermbg=DarkRed   ctermfg=White
hi FoldColumn   cterm=None    ctermbg=Grey      ctermfg=DarkBlue
hi Folded       cterm=None    ctermbg=None      ctermfg=Magenta
hi IncSearch    cterm=Reverse ctermbg=None      ctermfg=None
hi LineNr       cterm=None    ctermbg=None      ctermfg=Brown
hi ModeMsg      cterm=Bold    ctermbg=None      ctermfg=None
hi MoreMsg      cterm=None    ctermbg=None      ctermfg=DarkGreen
hi NonText      cterm=None    ctermbg=None      ctermfg=Blue
hi Pmenu        cterm=None    ctermbg=8         ctermfg=White
hi PmenuSel     cterm=None    ctermbg=DarkRed   ctermfg=None
hi Question     cterm=None    ctermbg=None      ctermfg=DarkGreen
hi Search       cterm=None    ctermbg=Green     ctermfg=Black
hi SpecialKey   cterm=None    ctermbg=None      ctermfg=Black
hi StatusLine   cterm=Bold    ctermbg=Blue      ctermfg=Yellow
hi StatusLineNC cterm=Bold    ctermbg=Blue      ctermfg=Black
hi Title        cterm=None    ctermbg=None      ctermfg=DarkMagenta
hi VertSplit    cterm=Bold    ctermbg=None      ctermfg=White
hi Visual       cterm=None    ctermbg=8         ctermfg=None
hi WarningMsg   cterm=None    ctermbg=None      ctermfg=DarkRed
hi WildMenu     cterm=None    ctermbg=Yellow    ctermfg=Black


" syntax highlightIng
hi Comment    cterm=None ctermfg=DarkRed     
hi Constant   cterm=None ctermfg=DarkGreen   
hi Identifier cterm=None ctermfg=DarkCyan    
hi Function   cterm=None ctermfg=Red         
hi PreProc    cterm=None ctermfg=DarkMagenta 
hi Special    cterm=Bold ctermfg=Cyan
hi Statement  cterm=Bold ctermfg=Blue        
hi Type       cterm=None ctermfg=Blue        


" Jsx syntax
hi jsRegexpString cterm=Italic      ctermfg=Green       
hi xmlTag         cterm=Italic      ctermfg=Yellow      
hi xmlTagName     cterm=Italic      ctermfg=Yellow      
hi xmlEndTag      cterm=Italic      ctermfg=Yellow      
hi xmlAttrib      cterm=Italic      ctermfg=Red         
hi xmlEqual       cterm=Italic,bold ctermfg=Red         
hi jsxRegion      cterm=None        ctermfg=LightYellow
hi jsObjectProp   cterm=None        ctermfg=Magenta
hi jsObjectKey    cterm=None        ctermfg=darkcyan

hi htmlTag ctermfg=6


" CommDoc
hi commDocType     cterm=Italic ctermbg=None ctermfg=Cyan
hi commDocVarName  cterm=None   ctermbg=None ctermfg=Green
hi commDocTag      cterm=None   ctermbg=None ctermfg=Magenta
hi commDocSpec     cterm=Italic ctermbg=None ctermfg=Red
hi commDocSpecShow cterm=Italic ctermbg=None ctermfg=Gray

hi typesSeparator cterm=Italic ctermfg=Green


" C improvement
hi cFuncCall cterm=None ctermbg=None ctermfg=Red


" CSS improvement
hi cssVar cterm=None cterm=Italic ctermbg=None ctermfg=Cyan



"HTML improvement
hi htmlTagName ctermfg=red
hi htmlTagN    ctermfg=red



" MarkDown improvement

hi htmlH1     cterm=none   ctermfg=red
hi htmlH2     cterm=none   ctermfg=red
hi htmlH3     cterm=none   ctermfg=red
hi htmlBold   cterm=bold   ctermfg=blue
hi htmlItalic cterm=italic ctermfg=darkgreen


" YouCompleteMe plugin
hi YcmErrorSection cterm=italic,underline,reverse,bold ctermbg=none ctermfg=lightred
