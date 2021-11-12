#!/bin/bash

source=''
target=''
zip=''

function parse_arg {
    arg="$@"
    if [ -f "$arg" ] || [ -d "$arg" ]; then
        # Local file
        if [ "$zip" ]; then
            echo "Zipping file..." > /dev/stderr
            zip -r "$arg.zip" "$arg" > /dev/stderr
            echo "Done zipping!" > /dev/stderr
            printf "$arg.zip"
        else
            printf "$arg"
        fi
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
        [[ "$path" =~ /[^/.]*$ ]] && path="$path/"
        arg=${arg%=*}
    fi
    if [[ "$arg" =~ :[^:]+$ ]]; then
        port=${arg##*:}
        arg=${arg%:*}
    fi
    if [[ "$arg" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        host=$arg
    fi


    cmd="scp://"

    # scp://[user@]host[:port][/path]

    [ "$user" ] && cmd="${cmd}${user}@"
    [ "$host" ] && cmd="${cmd}${host}" || exit 1
    [ "$port" ] && cmd="${cmd}:${port}"
    [ "$path" ] && cmd="${cmd}/${path}"

    echo -n "${cmd}"
}

while [ $# -gt 0 ]; do
    if [ "$1" = "--zip" ]; then
        zip=1
    else
        [ "$source" ] && target=$1 || source=$1
    fi
    shift
done


if [ ! "$source" ] || [ ! "$target" ]; then
    echo "USAGE = 'scp.sh [--zip] file|[user@]12.34.56.78[:22][=path] file|[user@]12.34.56.78[:22][=path]'"
    exit 1
fi

parsed_source=`parse_arg "$source"` 
parsed_target=`parse_arg "$target"`

[ ! "$parsed_source" ] && echo "'$source' could not be parsed..." && exit 1
[ ! "$parsed_target" ] && echo "'$target' could not be parsed..." && exit 1

scp -r $parsed_source $parsed_target
