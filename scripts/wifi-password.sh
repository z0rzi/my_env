#!/bin/bash

current_ssid=`nmcli -t -f NAME connection show --active | head -n1`

echo $current_ssid

sudo cat /etc/NetworkManager/system-connections/$current_ssid.nmconnection | awk -F = '/^psk=/{print $2}'
