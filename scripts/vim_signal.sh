#!/bin/bash

if [ $# -ge 1 ]; then
    echo $@ > /tmp/vim_sig.txt
else
    xclip -o > /tmp/vim_sig.txt
fi

pid=`ps -C nvim -o pid= | sort | head -n1`

[ ! "$pid" ] && exit 1

kill -10 $pid
