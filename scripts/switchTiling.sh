#!/bin/bash

current_state=`kreadconfig5 --file kwinrc --group Plugins --key kwin-script-tilingEnabled`

if [ "$current_state" = "false" ]; then
    kwriteconfig5 --file kwinrc --group Plugins --key kwin-script-tilingEnabled true
else
    kwriteconfig5 --file kwinrc --group Plugins --key kwin-script-tilingEnabled false
fi

kwin_x11 --replace &
