#!/bin/sh

if [ $# -ne 2 ]; then
    echo "Usage: $0 <pattern> <path>"
    exit 1
fi

fd -tf \
    -E '*.png' \
    -E '*.jpg' \
    -E '*.jpeg' \
    -E '*.ico' \
    -E '*.lock' \
    -E '*.lockb' \
    -S-100k \
    "$1" "$2" \
    -x sh -c 'echo -n "{} :" && echo "\n\`\`\`" && cat "{}" && echo "\n\`\`\`\n\n"'
