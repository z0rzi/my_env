#!/bin/bash

offsetx=0
offsety=0

scalex=1920
scaley=1080

tap="$HOME/.my_env/scripts/tap"

echo ''
echo "    <LEFT>/<RIGHT>/<UP>/<DOWN> to move offset"
echo "    Shift to change scale"
echo "    Ctrl for more precision"

while :; do
    cara=`tap`
    echo $cara

    [ "$cara" = "<LEFT>" ] && offsetx=$((offsetx - 10))
    [ "$cara" = "<RIGHT>" ] && offsetx=$((offsetx + 10))
    [ "$cara" = "<C-LEFT>" ] && offsetx=$((offsetx - 2))
    [ "$cara" = "<C-RIGHT>" ] && offsetx=$((offsetx + 2))
    [ "$cara" = "<UP>" ] && offsety=$((offsety - 10))
    [ "$cara" = "<DOWN>" ] && offsety=$((offsety + 10))
    [ "$cara" = "<C-UP>" ] && offsety=$((offsety - 2))
    [ "$cara" = "<C-DOWN>" ] && offsety=$((offsety + 2))

    [ "$cara" = "<S-LEFT>" ] && scalex=$((scalex - 10))
    [ "$cara" = "<S-RIGHT>" ] && scalex=$((scalex + 10))
    [ "$cara" = "<CS-LEFT>" ] && scalex=$((scalex - 2))
    [ "$cara" = "<CS-RIGHT>" ] && scalex=$((scalex + 2))
    [ "$cara" = "<S-UP>" ] && scaley=$((scaley - 10))
    [ "$cara" = "<S-DOWN>" ] && scaley=$((scaley + 10))
    [ "$cara" = "<CS-UP>" ] && scaley=$((scaley - 2))
    [ "$cara" = "<CS-DOWN>" ] && scaley=$((scaley + 2))

    xrandr --output eDP-1-1 --auto --rotate normal --pos ${offsetx}x${offsety} --output HDMI-1-1 --auto --rotate normal --primary --scale-from ${scalex}x${scaley} --pos 0x0
    echo xrandr --output eDP-1-1 --auto --rotate normal --pos ${offsetx}x${offsety} --output HDMI-1-1 --auto --rotate normal --primary --scale-from ${scalex}x${scaley} --pos 0x0
done
