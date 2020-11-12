#!/bin/bash

_file=''
_newlines=1
_nothing=''
_ignore=''
_clf='/tmp/.vim-line'
while [ $# -gt 0 ]; do
    if [ -f "$1" ]; then
        _file="$1"
    elif [ "$1" = "--cursor-line-file" ] || [ "$1" = "-CLF" ]; then
        shift
        [ -f "$1" ] && _clf="$1" || continue
    elif [ "$1" = "--nothing" ] || [ "$1" = "-N" ]; then
        shift
        [ "$1" ] && _nothing="$1" || continue
    elif [ "$1" = "--ignore" ] || [ "$1" = "-I" ]; then
        shift
        [ "$1" ] && _ignore="$1" || continue
    elif [ "$1" = "--no-newlines" ] || [ "$1" = "-nn" ]; then
        _newlines=''
    fi
    shift
done

if [ ! "$_file" ]; then
    echo
    echo "USAGE = '$0 <file> \\"
    echo "    [ --no-newlines | -nn ] \\"
    echo "    [ --nothing|-N <message> ] \\"
    echo "    [ --ignore|-I <line-pattern> ] \\"
    echo "    [ --cursor-line-file|-CLF <cursor-line-file> ] (/tmp/.vim-line by default)"
    echo
    exit 1
fi



function get_text_under_cursor {
    file="$1"
    cursorline="$2"

    [ ! -f "$file" ] && return

    maxline=`wc -l < "$file"`

    stopNext=''
    linecnt=0
    buff=''
    while [ $linecnt -lt $maxline ]; do
        linecnt=$((linecnt + 1))
        line=`sed -n "${linecnt}p" "$file"`

        [ "$_ignore" ] && [[ $line =~ $_ignore ]] && continue

        if [[ $line =~ ^[[:blank:]]*$ ]]; then
            [ "$stopNext" ] && break
            buff=''
        else
            buff="$buff\n$line"
        fi
        [ $linecnt -ge $cursorline ] && stopNext=1
    done

    if [ "$_newlines" ]; then
        # Trimming
        buff=`sed 's/^\\(\\\\n\\)*\\|\\(\\\\n\\)*$//g' <<< "$buff"`
    else
        # no newlines, no indentations
        buff=`sed -e 's/\\(\\\\n\\)\\+/ /g' -e 's/\\s\\+/ /g' -e 's/^\\s*\\|\\s*$//g' <<< "$buff"`
    fi

    if [ ! "$buff" ]; then
        if [ "$_nothing" ]; then
            echo -e "$_nothing"
        else
            return
        fi
    fi

    echo -e "$buff"
}

change=`date -r "$_file" +"%s%N"`
while :; do
    sleep .2s
    new_date=`date -r "$_file" +"%s%N"`
    [ "$new_date" = "$change" ] && continue
    change="$new_date"

    # letting for the clf to be written
    sleep .1s

    line=`cat $_clf`

    get_text_under_cursor "$_file" "$line"
done;
