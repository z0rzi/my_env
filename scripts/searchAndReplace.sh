#!/bin/bash

if [ $# -ne 3 ] || ( [ ! -f "$3" ] && [ ! -d "$3" ] ); then
    echo "USAGE = '$0 <regexp> <replacement> <file/directory>'"
    exit
fi

files=`grep -rl "$1" "$3"`

for file in $files; do
    echo $file
    sedStr=`sed 's/\//\\\\\//g' <<< $1`
    sed "s/$sedStr/$2/g" $file > /tmp/_.tmp && mv /tmp/_.tmp $file
done
