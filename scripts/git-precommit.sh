#!/bin/bash

cd $(git rev-parse --show-toplevel)

files=`git diff --name-only`

for file in $files; do
    diff=`git diff $file | grep --color=always '^+.*\(//\|\blog\b\)' 2> /dev/null`
    if [ "$diff" ]; then
        echo $(realpath $file)
        echo "$diff"
    fi
done
