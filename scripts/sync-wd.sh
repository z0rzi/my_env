#!/bin/bash

SYNCED_FILE='/tmp/.sync_wd'
SYNCED_CWD_FILE='/tmp/.sync_cwd'

function goto {
    local pane_id=$1
    path=`sed 's/'"'"'/\\\&/g' <<< $2`

    curr_cmd=`tmux display-message -p -t $pane_id -F "#{pane_current_command}"`

    if [ "$curr_cmd" = 'fish' ] || [ "$curr_cmd" = 'bash' ] || [ "$curr_cmd" = 'sh' ]; then
        tmux send-keys -t $pane_id "C-u"
        tmux send-keys -t $pane_id -l " cd '$path'"
        tmux send-keys -t $pane_id "Enter"
    fi
}

if [ $# -lt 1 ]; then
    echo "USAGE = 'syncwd.sh sync-me'"
    echo "                   unsync-me"
    echo "                   follow-me"
    echo "                   unfollow-me"
    echo "                   go-to <path>"
fi

[ ! -f "$SYNCED_FILE" ] && touch "$SYNCED_FILE"
[ ! -f "$SYNCED_CWD_FILE" ] && touch "$SYNCED_FILE"

function sendSyncedTo {
    echo "$@" > $SYNCED_CWD_FILE
    while read _pane_id; do
        goto $_pane_id "$@"
    done < $SYNCED_FILE
}

if [ "$1" = "goto" ]; then
    shift
    if [ ! -d "$@" ]; then
        echo "Wrong path"
        exit 1
    fi
    sendSyncedTo "$@"
    exit
fi
if [[ "$1" =~ ^(un)?sync-me$ ]]; then

    if [ "$1" = "sync-me" ]; then
        echo $TMUX_PANE >> "$SYNCED_FILE"
        goto $TMUX_PANE "`cat $SYNCED_CWD_FILE`"
        echo "Pane synced"
        exit
    fi
    if [ "$1" = "unsync-me" ]; then
        grep -v "$TMUX_PANE" "$SYNCED_FILE" > /tmp/.tmp
        mv /tmp/.tmp $SYNCED_FILE
        echo "Pane unsynced"
        exit
    fi
fi

function followme {
    local file="$1"
    local pane_id="$2"

    oldPath=''
    while :; do
        [ ! -f "$file" ] && break
        path=`tmux display-message -p -t "$pane_id" -F "#{pane_current_path}"`
        if [ "$path" != "$oldPath" ]; then
            oldPath=$path
            sendSyncedTo "$path"
        fi
        sleep .5
    done
}
if [[ "$1" =~ ^(un)?follow-me$ ]]; then

    follow_file="/tmp/.$TMUX_PANE"

    if [ "$1" = "follow-me" ]; then
        [ -f "$follow_file" ] && exit
        echo 1 > $follow_file
        followme "$follow_file" "$TMUX_PANE" &
        exit
    fi
    if [ "$1" = "unfollow-me" ]; then
        rm $follow_file
        exit
    fi
fi

