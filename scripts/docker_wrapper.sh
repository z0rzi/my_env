#!/bin/bash

GREEN='\033[1;32m'
RED='\033[1;31m'
BLUE='\e[1;34m'
BACK='\033[1;30m'
SHADOW='\033[0;37m'
GRAY=$SHADOW
NC='\033[0m'


if [ "$1" = "ps" ] && [[ ! "$@" =~ --format ]]; then
    shift
    echo -e "`docker ps $@ --format "Name . . . . ${BLUE}{{.Names}}${NC}\nID . . . . . ${RED}{{.ID}}${NC}\nImage ID . . {{.Image}}\nPorts. . . . ${GREEN}{{.Ports}}${NC}\nStatus . . . {{.Status}}\n${GRAY}Command. . . {{.Command}}\nCreated. . . {{.CreatedAt}}\nRunning For. {{.RunningFor}}\nNetwork. . . {{.Networks}}${NC}\n"`" | sed 's/->/ -> /g'

elif [ "$1" = "killall" ]; then
    shift
    docker kill $@ `\docker ps -aq`

elif [[ "$1" =~ (remove|rm)all ]]; then
    shift
    docker rm $@ `\docker ps -aq`

else
    docker $@
fi
