#!/bin/bash

if [ $# -lt 3 ]; then
    echo "USAGE = '$0 <regexp> <replacement> <file/directory>'"
    exit
fi

rx=$1
shift
replacement=$1
shift

rgFriendly=`sed 's/(/\\\\(/g' <<< $rx`
rgFriendly=`sed 's/)/\\\\)/g' <<< $rgFriendly`

files=`rg -l "$rgFriendly" $@`
rand=$RANDOM

echo $files

for file in $files; do
    echo $file
    path=`sed 's/^.*\///g' <<< "$file"`
    mkdir -p /tmp/back$rand/$path
    cp $file /tmp/back$rand/$path

    sedStr=`sed 's/\//\\\\\//g' <<< $rx`
    sedRepl=`sed 's/\//\\\\\//g' <<< $replacement`
    echo 'sed "s/'$sedStr'/'$sedRepl'/g" '$file
    sed "s/$sedStr/$sedRepl/g" $file > /tmp/_.tmp && mv /tmp/_.tmp $file
done

echo
echo "In case I messed up, the old files were saved at /tmp/back$rand/"
echo
