#!/bin/bash

pyfile=''
pypath=''

while [ $# -gt 0 ]; do
    if [ "$1" = "--python_path" ]; then
        shift
        if [ ! -d "$1" ]; then
            echo "Path not recognized '$1'";
            exit 1
        fi
        if [ ! -f "$1/python" ]; then
            echo "Python binary not found in directory '$1'";
            exit 1
        fi
        if [ ! -f "$1/pip" ]; then
            echo "Pip binary not found in directory '$1'";
            exit 1
        fi
        pypath=$1
    elif [ -f "$1" ]; then
        pyfile=$1
    else
        echo "Unrecognized argument '$1'"
    fi
    shift
done

path_save=$PATH

[ "$pypath" ] && PATH="$pypath:$PATH"

pypath=`realpath $pypath 2> /dev/null`

if [ ! "$pyfile" ]; then
    echo "USAGE = 'python_install_packages.sh [--python_path=</path/to/python>] <python_file.py>'"
fi

echo $pyfile
echo $pypath

[ "$pypath" ] && pyexe="$pypath/python" || pyexe="python"
[ "$pypath" ] && pipexe="$pypath/pip" || pipexe="pip"

last_module=''
while :; do
    $pyexe $pyfile 2> /tmp/_py_err
    [ ! $? ] && break;
    module=$(awk '/No module named/{print $5}' /tmp/_py_err | sed 's/[^a-zA-Z0-9-]//g')
    [ "$module" = "$last_module" ] && break
    last_module=$module
    echo "Installing $module"
    $pipexe install $module
done

PATH=$path_save
