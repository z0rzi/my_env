#!/bin/bash

if [ $# -ne 1 ]; then
    echo "USAGE = 'sound.sh [up|down|mute]'"
    exit 1
fi

sound=`amixer get Master | awk -F'[][]' '/Mono|Front/{print $2}' | trim | head -n1`
# stripping the % sign
sound=${sound%\%}

if [ $1 == "mute" ]; then
    amixer -q set Master toggle

    muted=`amixer sget Master | grep off`

    if [ "$muted" ]; then
        notify-send -h string:x-canonical-private-synchronous:sound -t 1000 "Volume: muted"
    else
        notify-send -h string:x-canonical-private-synchronous:sound -t 1000 "Volume: $sound%"
    fi

    exit 0
fi

step=5
# We round the sound percentage to the nearest multiple of $step
sound=$(( (sound + step/2) / step * step ))

if [ $1 == "up" ]; then
    new_value=$((sound + $step))
elif [ $1 == "down" ]; then
    new_value=$((sound - $step))
elif [ $1 == "set" ]; then
    new_value=$2
else
    echo "USAGE = 'sound.sh [up|down|set] [amount in percent]'"
    exit 1
fi

if [ $new_value -gt 100 ]; then
    new_value=100
elif [ $new_value -lt 0 ]; then
    new_value=0
fi

amixer -q set Master $new_value% unmute

notify-send -h string:x-canonical-private-synchronous:sound -t 1000 "Volume: $new_value%"
