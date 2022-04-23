#!/bin/bash

files=`git diff --name-only --cached`

for file in $files; do
    diff=`git diff --cached $file | grep --color=always '^+.*\(//\|\blog\b\)'`
    if [ "$diff" ]; then
        echo $file
        echo "$diff"
    fi
done
