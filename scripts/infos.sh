#!/bin/bash

BACK="\033[1;30m"
BLUE="\e[1;34m"
ORANGE="\e[1;33m"
GREEN="\033[1;32m"
RED="\033[1;31m"
SHADOW="\033[0;37m"
GRAY="$SHADOW"
NC="\033[0m"

file=''
isDirectory=''
format=''
while [ $# -gt 0 ]; do
    if [ -f "$1" ]; then
        file="$1"
    elif [ -d "$1" ]; then
        file="$1"
        isDirectory=1
    fi
    shift
done

if [ ! "$file" ]; then
    echo "USAGE = 'info.sh <file>'"
    exit 1
fi

modif=`date -r "$file" +"%Y-%m-%d %H:%M"`
size=`timeout 2 du -sh "$file" 2> /dev/null`
[ $? -ne 0 ] && size='Heavy ( timeout )' || size=`awk '{print $1}' <<< $size`

if [ "$isDirectory" ]; then
    sub_files=`timeout 2 find "$file" -type f 2> /dev/null | wc -l`
    [ $? -ne 0 ] && sub_files='A lot ( timeout )'

    echo -e ""
    echo -e "            ${BLUE}$file${NC}"
    echo -e ""
    echo -e "Size .  .  .  . ${GREEN}$size${NC}"
    echo -e "Files count   . ${ORANGE}$sub_files${NC}"
else
    extension=`tr '[:upper:]' '[:lower:]' <<< ${file##*.}`
    filename=${file##*/}
    echo -e ""
    echo -e "            ${BLUE}${filename%.*}${NC}.${GREEN}${filename##*.}${NC}"
    echo -e ""
    echo -e "Size .  .  .  . ${GREEN}$size${NC}"

    case $extension in
        "png"|"jpg"|"jpeg")
            size=`identify -format "%wx%h" "$file"`
            echo -e "Size    .  .  . ${ORANGE}$size${NC}"
            ;;
        "pdf")
            pages=`strings < "$file" | sed -n 's|.*/Count -\{0,1\}\([0-9]\{1,\}\).*|\1|p' | sort -rn | head -n 1`
            echo -e "Pages   .  .  . ${ORANGE}$pages${NC}"
            ;;
    esac
fi
echo -e "${SHADOW}Modified   .  . $modif${NC}"
