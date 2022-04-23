#!/bin/bash

if [ $# -ne 1 ]; then
    echo "USAGE = 'sound.sh [up|down|mute]'"
    exit 1
fi

monitor_name=`xrandr --prop --verbose | grep " connected" | awk '{print $1}'`
brightness=`xrandr --prop --verbose | grep -A10 " connected" | grep "Brightness" | awk '{print $2}'`

[ "$1" = "up" ] && brightness=`echo $brightness' + .1' | bc`
[ "$1" = "down" ] && brightness=`echo $brightness' - .1' | bc`

xrandr --output $monitor_name --brightness $brightness

percent=`echo $brightness' * 100 ' | bc`
percent=${percent%%.*}

notify-send -h string:x-canonical-private-synchronous:brightness -t 1000 "Brightness: $percent%"
