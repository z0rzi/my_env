#!/bin/bash

function parseColors() {
    colors="black 30 red 31 green 32 yellow 33 blue 34 magenta 35 cyan 36"

    text=""
    while read line; do
        text="$text\n$line"
    done

    while [[ "$text" =~ %[[:alpha:]]+\[[^\]]*\] ]]; do
        colorStr=`egrep -o "%[[:alpha:]]+\[[^]]*\]" <<< "$text"`

        color=`sed -e "s/^%//" -e "s/\[.*\]$//" <<< "$colorStr"`

        str=`sed -e "s/^%\w\+\[//" -e "s/\]$//" <<< "$colorStr"`

        colorCode=`egrep -o "$color [[:digit:]]+" <<< $colors | cut -d" " -f2`

        str="\\\\e[${colorCode}m$str\\\\e[39m"

        text=`sed "s/%[[:alpha:]]\+\[[^]]*\]/$str/g" <<< $text`
    done

    echo -e "$text"
}

parseColors
