#!/bin/bash

function is_on {
    res=`ip link | grep UP`

    [ "$res" ] || echo "1"
}

if [ $# -ne 1 ]; then
    echo "USAGE = '$0 < on | off | status | toggle >'"
    exit
fi

if [ "$1" = "status" ]; then
    [ "`is_on`" ] && echo on || echo off
    exit
fi

if [ "$1" = "toggle" ]; then
    [ "`is_on`" ] && flag=up || flag=down
else
    [ "$1" = "on" ] && flag=down || flag=up
fi


inters=`ip link show | awk '/^[[:digit:]]/ {sub(":$", "", $2); print $2}'`

for inter in $inters; do
    sudo ip link set $inter $flag
done

if [ "$flag" = "up" ]; then
    echo "Airplane turned off"
else
    echo "Airplane turned on"
fi
