#!/bin/bash

if [ $# -lt 1 ]; then
    printf "\n\tUSAGE = 'record.sh (window|screen) [--showKeys]'\n"
fi

if [ "$2" = "--showKeys" ]; then
    screenkey &
fi
if [ "$1" = "window" ]; then

    echo "Click on the window you want to record..."
    winid=$(xwininfo | awk '/^xwininfo: Window id:/{print $4}')

    recordmydesktop --s_quality -1 --fps 30 --no-frame --windowid $winid

elif [ "$1" = "screen" ]; then
    echo 'Which monitor do you want?'

    read winX winY <<< `xwininfo -shape | awk '/Absolute upper-left /{print $4}' | xargs`

    while read id dims name; do
        read x _ y _ _x _y <<< `echo $dims | sed 's/[\/x+]/ /g'`

        if [ $winX -lt $_x ] || [ $winX -ge $((_x + x)) ]; then continue; fi
        if [ $winY -lt $_y ] || [ $winY -ge $((_y + y)) ]; then continue; fi

        echo $x $y $_x $_y
        [ $_x -le 0 ] && _x=1 && x=$((x-1))
        [ $_y -le 0 ] && _y=1 && y=$((y-1))
        recordmydesktop --s_quality -1 --fps 30 --no-frame -x $_x -y $_y --width $x --height $y
        break;
    done <<< $(xrandr --listactivemonitors | awk '/[0-9]+: /{print $1, $3, $4}')
fi
killall screenkey 2> /dev/null
