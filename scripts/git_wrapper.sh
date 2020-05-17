#!/bin/bash

trap 'killall grep 2> /dev/null' SIGINT

gitPath=`git rev-parse --show-toplevel`

if [ "$1" = "" ]; then

    git status

elif [ "$1" = "push" ]; then

    git $@   

    [ -f "$gitPath/.git/hooks/post-push" ] && $gitPath/.git/hooks/post-push

    echo "executed hook $gitPath/.git/hooks/post-push"

elif [ "$1" = "commit" ]; then

    files=''
    allUnstaged=""

    for arg in $@; do
        if [[ "$arg" =~ ^-[a-zA-Z]*a[a-zA-Z]* ]]; then
            allUnstaged="1"
            break;
        fi
    done
    
    while read line; do
        if [[ "$line" =~ ^modified: ]] || [[ "$line" =~ ^new\ file: ]]; then
            fileName=`sed 's/[^:]\+:\s\+//g' <<< $line`
            files="$files $fileName"
        fi

        [ "$line" = "Changes not staged for commit:" ] && [ ! "$allUnstaged" ] && break;
    done <<< `git status`

    if [[ "$files" =~ ^\s*$ ]]; then
        echo "Nothing to commit!"
        echo
        exit;
    fi
    
    echo "Looking for nocommit flags, Ctrl+C to skip"
    echo

    # Making it in 2 separates part so I can commit my_env.git
    flags=`grep -rH "NO""COMMIT" $files 2> /dev/null`

    if [ "$flags" ]; then
        echo
        echo "Can't commit, nocommit flag found:"
        echo
        echo $flags
        echo
    else
        echo
        git "$@"
    fi

elif [ "$1" = "log" ]; then
    shift
    git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit $@

elif [ "$1" = "merge" ]; then
    git $@ --no-ff

elif [ "$1" = "difftool" ]; then
    args="--dir-diff"
    for arg in $@; do
        if [[ ! $arg =~ ^[^:]+:.+$ ]]; then
            continue
        fi
        file=`sed 's/^.*://g' <<< $arg`
        [ -f "$gitPath/$file" ] && args=""
    done
    git $@ $args

    if [ $? -ne 0 ]; then
        echo 'To configure your default merge/diff tool as meld:'
        echo ''
        echo 'git config --global diff.tool meld'
        echo 'git config --global difftool.meld.path "/usr/bin/meld"'
        echo 'git config --global difftool.prompt false'
        echo ''
        echo 'git config --global merge.tool meld'
        echo 'git config --global mergetool.meld.path "/usr/bin/meld"'
        echo 'git config --global mergetool.prompt false'
    fi

else
    git $@
fi
