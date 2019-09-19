#!/bin/bash


if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

path="`pwd`/`dirname $0`/"

ln -s $path/bashrc $HOME/.bashrc
ln -s $path/VScode_config ~/.config/Code\ -\ OSS/User

# Apache launchWeb script config
cp $path/files/httpd.template.conf /etc/httpd/conf/httpd.template.conf


# DBeaver configuration
cp $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json       $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json.backup
cp $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json.backup
cp $path/files/dbeaver/data-sources.json       $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/
cp $path/files/dbeaver/credentials-config.json $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/
