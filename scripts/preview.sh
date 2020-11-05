#!/bin/bash

if [ $# -lt 1 ]; then
    echo "USAGE = '$0 FILE_NAME:LINE <height>'"
    exit
fi

IFSS=$IFS

IFS=':'
read filename line _ <<< "$1"
IFS=$IFSS

filename=`sed "s/^['\"]\+\|['\"]\+$//" <<< "$filename"`

[ ! -f "$filename" ] && >&2 echo "$filename - not a valid file" && exit 1
[[ ! "$line" =~ ^[0-9]+$ ]] && >&2 echo "$line - not a valid number" && exit 1

height=$2

[[ "$height" =~ ^[0-9]+$ ]] || height=10

fileLength=`wc -l < $filename`

[ $height -gt $fileLength ] && height=$fileLength

[ $line -gt $((fileLength-$height/2)) ] && line=$((fileLength-$height/2))
[ $line -lt $(($height/2)) ] && line=$(($height/2 + 1))

fileExt=`sed 's/^.*\.//g' <<< $filename`

fileLength=`wc -l < $filename`

start=$((line-height/2))
end=$((line+height/2))

if [ $start -le 0 ]; then start=1; fi
if [ $end -ge $fileLength ]; then end=$((fileLength-1)); fi

sed -n ${start},${end}p $filename | highlight --syntax "$fileExt" -O ansi
