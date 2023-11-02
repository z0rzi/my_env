#!/bin/bash

if [ $# -lt 2 ]; then
    echo "USAGE = 'whenSaved.sh <dir/file to observe> <command to execute>'"
    exit;
fi


dir=$1
shift
cmd="$1"

child_pid=""
id_to_kill=""

shift
while [ $# -gt 0 ]; do
    cmd="$cmd \"$1\""
    shift
done

while inotifywait $dir 2> /dev/null; do
    clear;
    bash -c "$cmd" &
    sleep 1
done
