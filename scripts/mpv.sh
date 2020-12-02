#!/bin/bash

arg="$1"

# echo ${arg##*/}
# echo ${arg%/*}

subs=""
for file in `ls "${arg%/*}"`; do
    if [ "${file##*.}" = "srt" ]; then
        subs="$subs${arg%/*}/$file:"
        break
    fi
done

subs=${subs::-1}

echo mpv -sub-files=$subs $@
