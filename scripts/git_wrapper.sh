#!/bin/bash

trap 'killall grep 2> /dev/null' SIGINT

gitPath=`git rev-parse --show-toplevel`

if [ "$1" = "" ]; then

    git status

elif [ "$1" = "push" ]; then

    git "$@"   

    [ -f "$gitPath/.git/hooks/post-push" ] && $gitPath/.git/hooks/post-push

    echo "executed hook $gitPath/.git/hooks/post-push"

elif [ "$1" = "log" ]; then
    shift
    git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit $@

elif [ "$1" = "merge" ]; then
    if [[ ! $@ =~ -ff ]]; then
        git "$@" --no-ff
    else
        git "$@"
    fi

elif [ "$1" = "rebase" ]; then
    if [ $# -eq 1 ]; then
        echo '    To put your feature branch on top of master    |    To squash all comits from HEAD down to master    |    To fast-forward master in your branch    |    To delete branches'
        echo '                                                   |                                                     |                                             |'
        echo '        git checkout master                        |       git rebase -i master                          |        git checkout master                  |        git branch -d feat/my_feat'
        echo '        git pull                                   |                                                     |        git rebase feat/my_feat              |        git push --delete feat/my_feat'
        echo '        git checkout feat/my_feat                  |                                                     |        # OR                                 |'
        echo '        git rebase master                          |                                                     |        git merge -ff feat/my_feat           |'
    else
        git "$@"
    fi

elif [ "$1" = "difftool" ]; then
    args="--dir-diff"
    for arg in $@; do
        if [[ ! $arg =~ ^[^:]+:.+$ ]]; then
            continue
        fi
        file=`sed 's/^.*://g' <<< $arg`
        [ -f "$gitPath/$file" ] && args=""
    done
    git "$@" "$args"

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
    git "$@"
fi
