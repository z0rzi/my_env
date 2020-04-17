#!/bin/bash

RED='\\e[31m'
GREEN='\\e[32m'

grep -ron --color=never "\(removed\|installed\) [-a-zA-Z0-9_]\+" /var/log/pacman.log \
    | sed \
        -e "s/installed/+/g" \
        -e "s/removed/-/g" \
        -e "s/^\([0-9]\+\):\(.*\)$/\2 : \1/g" > /tmp/.pacpac

if [ "$1" = "--all" ]; then
    echo -e $(sed -e 's/ : [0-9]\+$//g' -e "s/^+/\\\\n${GREEN}+/g" -e "s/^-/\\\\n${RED}-/g" /tmp/.pacpac)
    rm /tmp/.pacpac
    exit;
fi


regex=`pacman -Q | cut -d' ' -f1 | xargs -I% echo -n "\|%"`

echo -e "`cat /tmp/.pacpac \
    | grep "^+ " \
    | sed 's/^+ //g' \
    | sort \
    | tr '\n' '\t' \
    | sed 's/\([a-zA-Z0-9_-]\+\) : \([0-9]\+\)\t\(\1 : [0-9]\+\(\t\|$\)\)*/\2 : \1\t/g' \
    | tr '\t' '\n' \
    | sort -n \
    | grep -o "\(^\|[[:blank:]]\)\($regex\)\([[:blank:]]\|$\)" \
    | sed "s/^/${GREEN}+/g"`"

rm /tmp/.pacpac
