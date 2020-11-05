#!/bin/bash

if [ $# -lt 2 ]; then
    echo "USAGE = '$0 [--overwrite||--replace] [-q|--quiet] <rule> <new dimensions> <input images>'"
    echo "rule can be:"
    echo "  --min"
    echo "      don't go over the given dimensions'"
    echo "  --max"
    echo "      don't go bellow the given dimensions'"
    exit
fi

files=''
rule=''
overwrite=''
dims=''
quiet=''
while [ $# -gt 0 ]; do
    if [ -f "$1" ]; then
        files=`printf "$files\n$1"`
    elif [[ "$1" =~ ^--(min|max)$ ]]; then
        rule="$1"
        shift
        if [[ "$1" =~ ^[0-9]+x[0-9]+$ ]]; then
            dims="$1"
        elif [[ "$1" =~ ^[0-9]+$ ]]; then
            dims=$1"x"$1
        fi
    elif [ "$1" = "-q" ] || [ "$1" = "--quiet" ]; then
        quiet='1'
    elif [ "$1" = "--overwrite" ] || [ "$1" = "--replace" ]; then
        overwrite='1'
    fi
    shift
done

if [ ! "$rule" ]; then
    echo "Rule should be --min or --max" > /dev/stderr
    exit 1
fi
if [ ! "$dims" ]; then
    echo "Dimension should look like '<width>x<height>' ( /\d+x\d+/ ) or '<width=height>' ( /\d+/ )" > /dev/stderr
    exit 1
fi

X=`cut -dx -f1 <<< $dims`
Y=`cut -dx -f2 <<< $dims`

ratio=$((X*100000/Y))

while read file; do
    if [ ! -f "$file" ] || [[ ! "$file" =~ (\.[jJ][pP][eE]?[gG]|\.[pP][nN][gG])$ ]]; then
        continue 
    fi

    old_size=`identify -format "%wx%h" "$file"`

    read oldX oldY _ <<< `tr 'x' ' ' <<< "$old_size"`

    new_ratio=$((oldX*100000/oldY))

    if [ $new_ratio -gt $ratio ]; then
        [ "$rule" = "--min" ] && dims="10000000x"$Y || dims=$X"x10000000"
    else
        [ "$rule" = "--min" ] && dims=$X"x10000000" || dims="10000000x"$Y
    fi

    path=`sed -e 's/\(^.*\/\).*$/\1/' <<< "$file"`
    [[ ! "$path" =~ /$ ]] && path=''
    filename=${file:${#path}:${#file}}
    newfile="${path}res_${filename}"


    if [ $oldY -lt $Y ] || [ $oldX -lt $X ]; then
        # no image bigger than origin
        cp "$file" "$newfile"
    else
        convert -resize $dims "$file" "$newfile"
    fi

    if [ ! "$quiet" ]; then
        new_size=`identify -format "%wx%h" "$newfile"`
        echo "$file resized from $old_size to $new_size"
    fi
    if [ "$overwrite" ]; then
        mv "$newfile" "$file"
    fi

    # deleting cache...
    # rm /tmp/magick*
done <<< "$files"
