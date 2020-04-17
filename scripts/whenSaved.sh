#!/bin/bash

if [ $# -lt 2 ]; then
    echo "USAGE = $0 <dir/file to observe> <command to execute>"
    exit;
fi


dir=$1
shift

cmd=$@

lastTime=`date +"%Y-%m-%dT%H:%M:%S"`
while :; do
    sleep 1
    if [ "`find $dir -newermt $lastTime`" ]; then
        lastTime=`date +"%Y-%m-%dT%H:%M:%S"`
        bash -c "$cmd"
    fi
done
