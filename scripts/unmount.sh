#!/bin/bash

if [ -b "$1" ]; then
    disk=$1
else
    disk=$(mount | grep -o "/dev/sd[^ab][0-9]" | tail -n1)
fi

udisksctl unmount -b $disk

rm ~/mnt 2> /dev/null
