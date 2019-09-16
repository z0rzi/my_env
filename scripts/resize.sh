#!/bin/bash

if [ $# -lt 2 ]; then
    echo "USAGE = '$0 <rule> <new dimensions> <input images>'"
    echo "rule can be:"
    echo "  --min"
    echo "      don't go over the given dimensions'"
    echo "  --max"
    echo "      don't go bellow the given dimensions'"
    exit
fi

rule=$1
shift
dims=$1
shift

if [ "$rule" != "--min" ] && [ "$rule" != "--max" ]; then
    echo "rule should be --min or --max"
    exit
fi
if [[ ! "$dims" =~ ^[0-9]+x[0-9]+$ ]]; then
    echo "Dimension should look like '<width>x<height>'"
    exit
fi

X=`cut -dx -f1 <<< $dims`
Y=`cut -dx -f2 <<< $dims`

ratio=$((X*100000/Y))

while [ $# -gt 0 ]; do
    if [ ! -f "$1" ]; then
        echo "$1 not a file"
        shift
        continue 
    fi

    old_size=`identify -format "%wx%h" $1`

    oldX=`cut -dx -f1 <<< $old_size`
    oldY=`cut -dx -f2 <<< $old_size`

    new_ratio=$((oldX*100000/oldY))

    if [ $new_ratio -gt $ratio ]; then
        [ "$rule" = "--min" ] && dims="10000000x"$Y || dims=$X"x10000000"
    else
        [ "$rule" = "--min" ] && dims=$X"x10000000" || dims="10000000x"$Y
    fi

    convert -resize $dims $1 res_$1
    new_size=`identify -format "%wx%h" res_$1`
    echo "$1 resized from $old_size to $new_size"

    shift
done

