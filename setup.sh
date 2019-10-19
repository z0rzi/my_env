#!/bin/bash

path="`pwd`/`dirname $0`/"
should_install=""

function errorMessage() {
    echo "USAGE = '$0 <to_setup> (--install)'"
    echo
    echo "to_setup can one of the following:"
    echo "  - all"
    echo "  - bashrc"
    echo "  - vim"
    echo "  - vscode"
    echo "  - dbeaver"
    echo

    exit;
}

function parseArgs() {
    [ $# -lt 1 ] && errorMessage
    export to_setup=$1

    while [ $# -gt 0 ]; do
        if [ "$1" = "--install" ]; then
            export should_install=1
        fi

        shift
    done
}

parseArgs $@

case "$to_setup" in
    "all" | "bashrc")
        echo "Starting bashrc setup..."
        ln -s $path/bashrc $HOME/.bashrc
        echo "bashrc setup completed"
        ;;

    "all" | "vscode")
        echo "Starting VScode setup..."

        ln -s $path/files/VScode ~/.config/Code\ -\ OSS/User

        [ "$should_install" ] && sudo pacman --noconfirm -S code

        echo "VScode setup completed"
        ;;

    "all" | "apache")
        echo "Starting Apache setup..."
        echo
        echo "executing the following command as root:"
        echo "ln -s $path/apache/files/httpd.template.conf /etc/httpd/conf/httpd.template.conf"
        sudo ln -s $path/apache/files/httpd.template.conf /etc/httpd/conf/httpd.template.conf

        [ "$should_install" ] && sudo pacman --noconfirm -S apache php php-apache

        echo "Apache setup completed"
        ;;


    "all" | "dbeaver")
        echo "Starting DBeaver setup..."

        mv $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json.backup       $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/.data-sources.json.backup
        mv $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json.backup $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/.credentials-config.json.backup
        mv $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json              $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/.data-sources.json
        mv $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json        $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/.credentials-config.json

        ln -s $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json       $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json.backup
        ln -s $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json.backup
        ln -s $path/files/dbeaver/data-sources.json                                              $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/data-sources.json
        ln -s $path/files/dbeaver/credentials-config.json                                        $HOME/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json

        [ "$should_install" ] && sudo pacman --noconfirm -S jdk-openjdk dbeaver

        echo "DBeaver setup completed"
        ;;

    "all" | "vim")
        echo "Starting VIM setup..."

        mv $HOME/.vim $HOME/..vim
        ln -fs $path/files/vim $HOME/.config/nvim
        ln -fs $path/files/vim $HOME/.vim
        ln -fs $path/files/vim/vimrc $HOME/.vimrc

        if [ "$should_install" ]; then
            echo "Installing nvim, gvim, fzf, pip"
            sudo pacman --noconfirm -S nvim gvim fzf pip
            pip3 install --user pynvim
            pip3 install --user --upgrade pynvim
            echo "You should logout for the changes to take effect."
            echo "You should install the font present in '$HOME/.vim/fonts/' for the icons to work properly"
        fi

        echo "VIM setup completed"
        ;;
    *)
        errorMessage
        ;;
esac
