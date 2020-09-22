#!/bin/bash

BROWSER="brave"

if [[ "$1" = magnet* ]]; then
    echo -n "$@" | xclip -sel clip
    [ ! "`ps -e | grep rtorrent`" ] && kitty -e 'rtorrent'

if [[ "$1" = *pdf ]]; then
    okular $PWD/$1 & 2> /dev/null > /dev/null

elif [[ "$1" =~ \.(ts|js|vim|jrl)$ ]]; then
    kitty nvim $PWD/$1 & 2> /dev/null > /dev/null

else
    /usr/bin/.xdg-open $@
fi
