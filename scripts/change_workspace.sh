#!/bin/bash

raw=`parse_json.js "$(i3-msg -t get_workspaces)"`

function get_value {
    echo "$raw" | grep "^$1:" | cut -d' ' -f2
}


amount=`get_value "|#"`

cnt=0
current_name=''
while test $cnt -lt $amount; do
    focused=`get_value "|$cnt|focused"`
    if test "$focused" = "true"; then
        current_name=`get_value "|$cnt|name"`
        break
    fi
    cnt=$((cnt+1))
done

side=${current_name::1}
num=${current_name:1}

move=""
direction=""

while test $# -gt 0; do
    [ "$1" = "-m" ] && move=1
    [[ "$1" != -* ]] && direction=$1
    shift
done

case $direction in
    "up")
        [ $num -lt 5 ] && num=$((num+1))
        ;;
    "down")
        [ $num -gt 1 ] && num=$((num-1))
        ;;
    "right")
        side=r
        ;;
    "left")
        side=l
        ;;
esac

[ "$move" ] && \
    i3-msg move container to workspace "$side$num"; workspace "$side$num" || \
    i3-msg workspace "$side$num"

