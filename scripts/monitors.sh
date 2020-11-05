#!/bin/bash

function generate_monitor_hash {
    echo -n '' > /tmp/.displays
    while read name infos; do
        sed -e 's/^.*EDID: //g' -e 's/\s*//g' -e 's/^.\{17\}//g' -e 's/^\(.\{10\}\).*$/\1/' <<< "$infos" >> /tmp/.displays
    done <<< `xrandr --prop | xargs | grep -o '[a-zA-Z0-9-]* connected\( primary\)\? \([0-9x+]* \)\?\(([^)]*) \)\?\([0-9xm ]* \)\?EDID: [0-9a-f ]*'`

    sort /tmp/.displays | xargs | sed 's/\s*//g'
}

if [ "$1" = "--help" ]; then
    echo "USAGE = monitors.sh [--help]              ( Displays this help )"
    echo "                    [--get-hash]          ( Only provides hash for current setup )"
    echo "                    [--get-file]          ( Only provides file name for current setup )"
    echo "                    [--config-exists]     ( Does a config script eists for current hash )"
    exit 0
fi

if [ "$1" = "--get-hash" ]; then
    generate_monitor_hash
    exit 0
fi

filepath="$HOME.screenlayout/"
filename="`generate_monitor_hash`.sh"

if [ "$1" = "--get-file" ]; then
    echo $filepath$filename
    exit 0
fi

if [ "$1" = "--config-exists" ]; then
    [ -f "$filepath$filename" ] && echo '1' && exit 0
    exit 1
fi

if [ -f "$filepath$filename" ]; then
    bash -c "$filepath$filename"
    exit 0
else
    echo "No configuration for this setup. To create it, put it in the file '$filepath$filename'"
    exit 1
fi
