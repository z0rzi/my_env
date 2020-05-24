#!/bin/bash

addr=$1
port=$2

if [[ "$1" =~ ^.+?:[0-9]+$ ]]; then
    s=$IFS
    IFS=':'
    read addr port <<< $1
    IFS=$s
fi

if ! ( [ "$addr" ] && [ "$port" ] ); then
    echo "USAGE = $0 <address>:<port>"
    exit
fi


(echo >/dev/tcp/$addr/$port) &> /dev/null \
    && echo "Open" \
    || echo "Close"
