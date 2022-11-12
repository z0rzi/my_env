#!/bin/bash

filetype=`xdg-mime query filetype "$1"`

echo $filetype

echo 'Choose the new application'
app=`ls /usr/share/applications/ | fzf`

echo $app

a=''
while [ "$a" != 'y' ] && [ "$a" != 'n' ]; do
    echo -n "You're about to change the default application for the filetype '$filetype', do you want to continue? (y/n) "
    read -n1 a
done

[ "$a" = 'n' ] && exit 1

xdg-mime default $app $filetype
