#!/bin/bash

if [ -b "$1" ]; then
    disk=$1
else
    mounted=$(df | grep -o '/dev/sd..' | xargs | sed 's/\s\+/\\|/g')
    disk=$(ls -t /dev/sd?? | grep -v "$mounted")
fi

res=$(udisksctl mount -b $disk)

[ $? -ne 0 ] && exit 1

echo $res

path=${res##*at }

if [ ! -e "$HOME/mnt" ]; then
    ln -s $path $HOME/mnt
    echo "Symlink created on ~/mnt"
fi
