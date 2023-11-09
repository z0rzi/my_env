#!/bin/bash

current_ssid=`nmcli -t -f NAME connection show --active | head -n1`

echo $current_ssid

file="/etc/NetworkManager/system-connections/$current_ssid.nmconnection" 

if [ -f "$file" ]; then
    sudo cat "$file" | awk -F = '/^psk=/{print $2}'
    exit 0
fi

file="/etc/NetworkManager/system-connections/$current_ssid" 

if [ -f "$file" ]; then
    sudo cat "$file" | awk -F = '/^psk=/{print $2}'
    exit 0
fi

echo 'No password found...'
