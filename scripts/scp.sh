#!/bin/bash

function parse_arg {
    arg=$@
    if [ -f "$arg" ] || [ -d "$arg" ]; then
        # Local file
        printf "$arg"
        return
    fi

    user=$USER
    path='/tmp/'
    port=22

    if [[ "$arg" =~ ^[a-zA-Z_-]*@ ]]; then
        user=${arg%%@*}
        arg=${arg#*@}
    fi
    if [[ "$arg" =~ =[^=]+$ ]]; then
        path=${arg##*=}
        arg=${arg%=*}
    fi
    if [[ "$arg" =~ :[^:]+$ ]]; then
        port=${arg##*:}
        arg=${arg%:*}
    fi
    if [[ "$arg" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        host=$arg
    fi

    cmd=""

    # "USAGE = 'scp.sh <FILE> [user@]12.34.56.78[:22][=path]'"

    [ "$port" ] && cmd="-P ${port} "
    [ "$user" ] && cmd="${cmd}${user}@"
    [ "$host" ] && cmd="${cmd}${host}" || exit 1
    [ "$path" ] && cmd="${cmd}:${path}"

    echo -n "$cmd"
}


if [ $# -ne 2 ]; then
    echo "USAGE = 'scp.sh file|[user@]12.34.56.78[:22][=path] file|[user@]12.34.56.78[:22][=path]'"
    exit 1
fi

scp -r `parse_arg $1` `parse_arg $2`
