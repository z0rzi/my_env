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

trap "kill -9 \$child_pid" EXIT

lastTime=`date +"%Y-%m-%dT%H:%M:%S"`
lastID=$RANDOM
while :; do
    sleep 1
    if [ "`find $dir -newermt $lastTime`" ]; then
        id_to_kill=$lastID
        lastID=$RANDOM
        lastTime=`date +"%Y-%m-%dT%H:%M:%S"`
        printf "\n\n\t💾 \e[1;34mSaved, launching command...\033[0m 💾\n\n"
        for cpid in $child_pid; do
            kill -9 "$cpid" 2>&1 > /dev/null
        done

        bash -c "$cmd" &

        pid=$BASHPID
        child_pid=`pgrep -P $pid`
    fi
done
