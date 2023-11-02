#!/bin/bash

if [ $# -ne 3 ] || ( [ ! -f "$3" ] && [ ! -d "$3" ] ); then
    echo "USAGE = '$0 <regexp> <replacement> <file/directory>'"
    exit
fi

files=`rg -l "$1" "$3"`
rand=$RANDOM

for file in $files; do
    echo $file
    path=`sed 's/^.*\///g' <<< "$file"`
    mkdir -p /tmp/back$rand/$path
    cp $file /tmp/back$rand/$path

    sedStr=`sed 's/\//\\\\\//g' <<< $1`
    sedRepl=`sed 's/\//\\\\\//g' <<< $2`
    sed "s/$sedStr/$sedRepl/g" $file > /tmp/_.tmp && mv /tmp/_.tmp $file
done

echo
echo "In case I messed up, the old files were saved at /tmp/back$rand/"
echo
