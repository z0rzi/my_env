#!/bin/bash

RED='\\e[31m'
GREEN='\\e[32m'

echo -e $(grep -ro --color=never "\(removed\|installed\) [-a-zA-Z0-9_]\+" /var/log/pacman.log | sed -e "s/installed/\\\n${GREEN}+/g" -e "s/removed/\\\\n${RED}-/g")
