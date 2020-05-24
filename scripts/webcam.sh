#!/bin/bash

cnt=0

while [ $cnt -lt 10 ]; do
    if [ -e "/dev/video$cnt" ]; then
        # nohup gst-launch-1.0 v4l2src device=/dev/video$cnt ! xvimagesink 2&> /dev/null & disown
        nohup gst-launch-1.0 v4l2src device=/dev/video$cnt > /dev/null ! xvimagesink & disown
    fi
    cnt=$((cnt+1))
done
