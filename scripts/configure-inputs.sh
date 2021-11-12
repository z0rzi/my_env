#!/bin/bash
DEVS_KEYBOARD="keyboard"
DEVS_MOUSE="mouse logitech.m[0-9]+"
DEVS_CAM="cam"
DEVS_TABLET="wacom"

declare -A oldIds

function configure_mouse {
    id=$1
    xinput set-prop "$id" "libinput Middle Emulation Enabled" 1
}

function configure_keyboard {
    id=$1
    xkbcomp -w0 -I$HOME/.xkb ~/.xkb/keymap/basic $DISPLAY
}

function configure_cam {
    id=$1
}

function configure_tablet {
    id=$1
    monitor=0

    ids=`xsetwacom --list devices | grep -o "id: [0-9]\+" | cut -d' ' -f2`

    for id in ${ids[@]}; do
        xsetwacom --set $id MapToOutput HEAD-$monitor
    done
}

function check_update {
    rx=$1
    cb=$2

    ids=`xinput | awk 'tolower($0) ~ /'$rx'.*id=[0-9]+/{gsub("^.*id=", "", $0); gsub("[^0-9].*$", "", $0); printf("%s\n", $0)}'`
    if [ "${oldIds[$rx]}" != "$ids" ]; then
        oldIds[$rx]=$ids
        for id in $ids; do
            echo $rx $id
            $cb $id 2> /dev/null
        done
    fi
}

# ps h -C "configure-inputs" -o "%p" | grep -v "^\($PPID\|$BASHPID\|$$\)$" | xargs kill -9
while :; do
    for device_rx in $DEVS_KEYBOARD; do check_update $device_rx configure_keyboard; done
    for device_rx in $DEVS_MOUSE; do check_update $device_rx configure_mouse; done
    for device_rx in $DEVS_CAM; do check_update $device_rx configure_cam; done
    for device_rx in $DEVS_TABLET; do check_update $device_rx configure_tablet; done
    sleep 1;
done
