#!/bin/bash

if [ $# -ne 1 ]; then
    echo "USAGE = 'brightness.sh [up|down|set] [amount in percent]'"
    exit 1
fi

max=$(brightnessctl max)
current=$(brightnessctl get)

current_percent=$((current * 100 / max))

step=5
if [ $1 == "down" ]; then
    [ $current_percent -le 10 ] && step=2
    [ $current_percent -le 5 ] && step=1
    [ $current_percent -eq 1 ] && exit 0
fi
# We round the current percentage to the nearest multiple of $step
current_percent=$(( (current_percent + step/2) / step * step ))

if [ $1 == "up" ]; then
    new_percent=$((current_percent + $step))
elif [ $1 == "down" ]; then
    new_percent=$((current_percent - $step))
elif [ $1 == "set" ]; then
    new_percent=$2
else
    echo "USAGE = 'brightness.sh [up|down|set] [amount in percent]'"
    exit 1
fi

if [ $new_percent -gt 100 ]; then
    new_percent=100
elif [ $new_percent -lt 0 ]; then
    new_percent=0
fi
brightnessctl set $new_percent%

notify-send -h string:x-canonical-private-synchronous:brightness -t 1000 "Brightness: $new_percent%"
