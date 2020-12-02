#!/bin/bash

file=$1
ext=${file#*.}

resize.sh $1 --replace -o /tmp/.img.${ext} --max 1920

case "$ext" in
    "png")
        convert "/tmp/.img.${ext}" -opaque white -flatten /tmp/.img.jpg
        file="/tmp/.img.jpg"
        mime='image/jpeg'
        jpegoptim $file --size=150k;;

    "jpeg"|"jpg")
        mime='image/jpeg'
        jpegoptim $file --size=150k;;

    "svg")
        mime='image/svg';;
    *)
        exit 1
esac

copyq copy $mime - < $file
