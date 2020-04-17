#!/bin/bash

if [ $# -ne 1 ]; then
    echo "One argument expected..."
    exit;
fi

if [[ "$1" =~ \.git$ ]]; then
    git_url=$1
else
    git_url=$(\
        wget -O - -o /dev/null "https://aur.archlinux.org/packages/$1/" \
            | grep -o "https\?://aur[^:'\"]*\.git" \
            | head -n1 \
    )

    if [ ! "$git_url" ]; then
        git_url=$(\
            wget -O - -o /dev/null "https://aur.archlinux.org/packages/$1-git/" \
                | grep -o "https\?://aur[^:'\"]*\.git" \
                | head -n1 \
        )
    fi

    if [ ! "$git_url" ]; then
        echo "Could not find package '$1' or '$1-git'"
        exit;
    fi
fi

dir_name="git$RANDOM"

cd /tmp

git clone $git_url $dir_name

cd $dir_name

makepkg -si

cd /tmp

\rm -rf $dir_name
