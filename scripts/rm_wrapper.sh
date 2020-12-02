#!/bin/bash

complete -c rm -e

num1=$((RANDOM%10))
num2=$((RANDOM%10))
num3=$((RANDOM%100))
operation="$num1 * $num2 + $num3"

BLUE="\e[1;34m"
NC="\033[0m"

echo ""
echo "  🗑️ You're about to delete files forever"
echo ""
echo -e "  If you're sure of what you're doing, resolve '${BLUE}S = $operation${NC}' below:"
echo ""

realRes=$(bc <<< "$operation")
while [ "$res" != "$realRes" ]; do
    read -p "  S = " res
done
echo ""

args=''
for arg in "$@"; do
    args=$args" $(printf "%q" "$arg")"
done
eval "rm $args"
