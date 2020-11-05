#!/bin/bash

rand=$RANDOM
mkdir /tmp/.$rand

while [ $# -gt 0 ]; do
    [[ ! "$1" =~ \.[pP][nN][gG]$ ]] && shift && continue;
    noext=${1%.[pP][nN][gG]}
    convert "$1" "$noext.jpg"
    mv "$1" /tmp/.$rand
    shift
done

echo "Old files were moved to '/tmp/.$rand'"
