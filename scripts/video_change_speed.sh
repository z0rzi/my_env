#!/bin/bash

if [ $# -ne 3 ]; then
    echo
    echo "This script is used to accelerate a video playspeed"
    echo
    echo "    USAGE = '$0 <input.mp4> <output.mp4> <acceleration factor>'"
    echo
    echo "    e.g.: $0 in.mp4 out.mp4 2 # To double the speed"
    echo
    exit;
fi


ffmpeg -i $1 -filter:v "setpts=`bc <<< "scale=2;1/$3"`*PTS" $2
