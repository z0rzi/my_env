#!/bin/bash
DEVS="mouse keyboard cam"

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

# ps h -C "configure-inputs" -o "%p" | grep -v "^\($PPID\|$BASHPID\|$$\)$" | xargs kill -9
while :; do
    for device in $DEVS; do
        ids=`xinput | awk 'tolower($0) ~ /'$device'.*id=[0-9]+/{gsub("^.*id=", "", $0); gsub("[^0-9].*$", "", $0); printf("%s\n", $0)}'`
        if [ "${oldIds[$device]}" != "$ids" ]; then
            oldIds[$device]=$ids
            for id in $ids; do
                configure_$device $id 2> /dev/null
            done
        fi
    done
    sleep 1;
done
