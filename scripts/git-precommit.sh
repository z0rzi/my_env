#!/bin/bash

files=`git diff --name-only`

for file in $files; do
    diff=`git diff $file | grep --color=always '^+.*\(//\|\blog\b\)'`
    if [ "$diff" ]; then
        echo $file
        echo "$diff"
    fi
done
