#!/bin/bash


if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

path="`pwd`/`dirname $0`/"

ln -s $path/bashrc $HOME/.bashrc
ln -s $path/VScode_config ~/.config/Code\ -\ OSS/User

cp $path/files/httpd.template.conf /etc/httpd/conf/httpd.template.conf
cp $path/files/data-sources.json $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/


