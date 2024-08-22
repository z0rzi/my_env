#!/bin/bash

complete -c rm -e

BLUE="\e[1;34m"
NC="\033[0m"

function operation() {
    num1=$((RANDOM%10))
    num2=$((RANDOM%10))
    num3=$((RANDOM%100))
    operation="$num1 * $num2 + $num3"

    echo ""
    echo "  🗑️ You're about to delete files forever"
    echo ""
    echo -e "  If you're sure of what you're doing, resolve '${BLUE}S = $operation${NC}' below:"
    echo ""

    realRes=$(bc <<< "$operation")
    while [ "$res" != "$realRes" ]; do
        read -p "  S = " res
    done
}

function type() {
    # A list of words that the user will have to type
    WORDS="the quick brown fox jumps over the lazy dog and not or think thinking tired eating clear water drink drinking sleep sleeping awake hungry gorgeous beautiful ugly pretty handsome smart intelligent dumb stupid happy sad angry mad love hate like dislike good bad right wrong true false yes no maybe always never sometimes day night morning evening afternoon noon midnight today tomorrow yesterday now later soon early late big small tall short long wide narrow thick thin heavy light fast slow quick easy hard soft loud quiet high low near far deep shallow clean dirty wet dry hot cold cool warm fresh stale old new young rich poor expensive cheap full empty wide narrow thick thin"

    # Creating a sentence, with the words, shuffled separated by a space
    sentence=$(echo $WORDS | tr " " "\n" | shuf | head -n5 | tr "\n" " " | trim)

    echo "Copy the following sentence:"
    echo -e $BLUE$sentence$NC

    timestamp_before=$(date +%s)

    # Disabling the echo
    stty -echo

    # Reading the user input, character by character
    typed=""
    while [ "$typed" != "$sentence" ]; do
        read -n1 char
        if [ "$char" == $'\177' ]; then
            # If the character is a backspace, remove the last character from the typed string
            typed=${typed%?}
        elif [ "$char" == '' ]; then
            # If the character is a space
            typed="$typed "
        else
            typed="$typed$char"
        fi

        # Erasing line, and printing the typed string
        echo -en "\033[2K\r$typed"
    done
    echo

    stty echo
}

echo ""

# operation
type

echo

args=''
for arg in "$@"; do
    args=$args" $(printf "%q" "$arg")"
done
eval "rm $args"
