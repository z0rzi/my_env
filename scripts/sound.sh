#!/bin/bash

if [ $# -ne 1 ]; then
    echo "USAGE = 'sound.sh [up|down|mute]'"
    exit 1
fi

case "$1" in
    "up")
        amixer -q set Master 5%+ unmute
        ;;
    "down")
        amixer -q set Master 5%- unmute
        ;;
    "mute")
        amixer -q set Master toggle
        ;;
esac

muted=`amixer sget Master | grep off`

if [ "$muted" ]; then
    notify-send -h string:x-canonical-private-synchronous:sound -t 1000 "Volume: muted"
else
    sound=`awk -F"[][]" '/Left:/ { print $2 }' <(amixer sget Master)`
    notify-send -h string:x-canonical-private-synchronous:sound -t 1000 "Volume: $sound"
fi
