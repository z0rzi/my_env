#!/bin/bash

# From https://wiki.archlinux.org/index.php/Pacman/Tips_and_tricks#Listing_packages

choices=''

function error() {
    echo "USAGE = 'pacman.sh last-installed'"
    echo "        'pacman.sh heavy'"
    echo "        'pacman.sh browse"
    exit
}


case  "$1"  in
    "last-installed")
        expac --timefmt='%Y-%m-%d %T' '%l\t%n' | sort | tail -n 40
        ;;

    "heavy")
        expac -H M "%011m\t%-20n" $(comm -23 <(pacman -Qqen | sort) <({ pacman -Qqg base-devel; expac -l '\n' '' base; } | sort | uniq)) | sort -n
        ;;

    "browse")
        pacman -Qq | fzf --preview 'pacman -Qil {}' --layout=reverse --bind 'enter:execute(pacman -Qil {} | less)'
        ;;

    *)
        error
esac
