#!/bin/bash

function error {
    echo "USAGE = 'pics.sh fix-name'"

    exit 1
}

function format_number {
    num=$1
    amount=$2

    while [ ${#num} -lt $amount ]; do
        num=0$num
    done

    echo -n $num
}

function fixName {
    while [ $# -gt 0 ]; do
        for file in "$1"; do
            if [ -d "$file" ]; then
                fixName "$file"/*
            else
                read ext newFile <<< `awk '{
                    split($0, arr, /\//);

                    filePath = "";
                    for (i=0 ; i<length(arr)-1 ; i++)
                        if (length(filePath) == 0)
                            filePath = arr[i];
                        else
                            filePath = filePath "/" arr[i];

                    fileName = arr[length(arr)-1];

                    extIdx = match(fileName, /\.[[:alpha:]0-9]*$/);
                    ext = substr(fileName, extIdx)

                    res = match(fileName, /20[0-9]{2}[01][0-9][0-3][0-9]/);

                    if (res != 0) {
                        newFile = filePath "/" substr(fileName, res, 8)
                        printf("%s %s\n", ext, newFile)
                    }
                }' <<< "$file"`

                [ "$ext" ] && [ "$newFile" ] || continue

                offset=0
                while [ -f "${newFile}_`format_number $offset 4`${ext}" ]; do
                    offset=$((offset+1))
                done

                # echo "\"$file\"" "\"${newFile}_`format_number $offset 4`${ext}\""
                mv "$file" "${newFile}_`format_number $offset 4`${ext}"
                # eval "$cmd"
            fi
        done
        shift
    done
}

case "$1" in
    "fix-name")
        shift
        fixName "$@"
        ;;
    *)
        error
        ;;
esac
