#!/bin/bash

if [[ "$@" =~ -h ]]; then
    echo "USAGE = '$0 (<monitor-number>|all|--help)'"
    exit
fi

monitor=$1
[[ "$monitor" =~ [0-9] ]] || monitor=0


ids=`xsetwacom --list devices | grep -o "id: [0-9]\+" | cut -d' ' -f2`

for id in ${ids[@]}; do
    xsetwacom --set $id MapToOutput HEAD-$monitor
done
