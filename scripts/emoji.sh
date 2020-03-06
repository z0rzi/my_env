#!/bin/bash

if [[ "$1" = "--help" ]]; then
    echo -e "\nUse --edit to edit the emojis file\n"
    exit;
fi

path="$HOME/.my_env/files/emojis.txt"

if [[ "$1" = "--edit" ]]; then
    vim $path
    exit;
fi


choice=$(cat $path | fzf --no-sort)

emoji=`echo $choice | sed -e 's/\s\+|.*$//'`
desc=`echo $choice | sed -e 's/^.*|\s*//'`

grep "|\s*$desc$" $path | head -n1 > /tmp/emoji
grep -v "|\s*$desc$" $path >> /tmp/emoji

cat /tmp/emoji > $path


echo $emoji | xclip -sel clip

sleep .01
