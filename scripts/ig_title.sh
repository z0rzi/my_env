#!/bin/bash

tags="#meme #memes #memesdaily #funnymemes #lol #dank #follow #humor #like #dankmeme #love #lmao #comedy #dailymemes #anime #edgymemes #fun #photooftheday #smile"

titles=$(cat << EOF
The Perfect meme doesn't exis...
Who else!?
Follow for Dankk memes
Welp
LMAO.
EOF
)

num=$((RANDOM%$(wc -l <<< "$titles") + 1))

title=$(sed -n $num'{p;q}' <<< "$titles")

printf "$(cat << EOF
$title

$tags
EOF
)" | xclip -sel clip

printf "$(cat << EOF
$title

$tags
EOF
)"
