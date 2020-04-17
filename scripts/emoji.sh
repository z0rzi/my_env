#!/bin/bash

if [[ "$1" = "--help" ]]; then
    echo -e "\nUse --edit to edit the emojis file\n"
    exit;
fi

path="$HOME/.my_env/files/emojis.txt"

if [[ "$1" = "--edit" ]]; then
    nvim $path
    exit;
fi


choice=$(echo -e "`sed -e 's/,\(.*\)$/\\\e[30m,\1/' -e 's/^/\\\e[0m/' $path`" | fzf --no-sort --ansi)

emoji=`echo $choice | sed -e 's/^\([^\s|]\+\)|.*$/\1/' -e 's/\s//g'`
desc=`echo $choice | sed -e 's/^[^|]*|\s*//'`

( [ ! "$emoji" ] || [ ! "$desc" ] ) && exit

grep "|\s*$desc$" $path | head -n1 > /tmp/emoji
grep -v "|\s*$desc$" $path >> /tmp/emoji

cat /tmp/emoji > $path

echo -n $emoji | xclip -sel clip

sleep .01
