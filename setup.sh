#!/bin/bash


if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

path="`pwd`/`dirname $0`/"

ln -s $path/bashrc $HOME/.bashrc
ln -s $path/VScode_config ~/.config/Code\ -\ OSS/User

# Apache launchWeb script config
ln -s $path/apache/files/httpd.template.conf /etc/httpd/conf/httpd.template.conf

# Vim configuration
mv $HOME/.vim $HOME/..vim
ln -s $path/files/vim $HOME/.vim

# DBeaver configuration
mv $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json.backup       $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/.data-sources.json.backup
mv $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json.backup $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/.credentials-config.json.backup
mv $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json              $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/.data-sources.json
mv $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json        $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/.credentials-config.json

ln -s $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json       $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json.backup
ln -s $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json.backup
ln -s $path/files/dbeaver/data-sources.json                                              $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json
ln -s $path/files/dbeaver/credentials-config.json                                        $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json
