#!/bin/bash

# See https://github.com/i3/i3/blob/next/contrib/trivial-bar-script.sh
#
# For icons: https://fontawesome.com/cheatsheet?from=io


#
# DATA
#
    MODULES='docker ram swap cpu battery time'
    # MODULES='cpu'

    ICON_CPU='🔥'
    ICON_SWAP='🍩'
    ICON_RAM='🥓'
    ICON_TIME=''
    ICON_DOCKER=''
    ICON_BATTERY_80=''
    ICON_BATTERY_60=''
    ICON_BATTERY_40=''
    ICON_BATTERY_30=''
    ICON_BATTERY_00=''
    ICON_BATTERY_CHARGING='⚡'

    THRESHOLD_BATTERY_LOW=20
    THRESHOLD_BATTERY_HIGH=95

    COLOR_DOCKER_ON="#0399c4"
    COLOR_DOCKER_OFF="#999999"

    COLOR_BATTERY_HIGH="#27ae60"
    COLOR_BATTERY_LOW="#e74c3c"

    COLOR_TIME="#eeeeee"

#
# HELPERS
#
    function formatPercentage() {
        sed -e 's/^0*\([0-9]\+\.\)/\1/' -e 's/\(\..\).*$/\1/' -e 's/\.0*$//' -e 's/\(\.[0-9]*[1-9]\)0*$/\1/' <<< "$1"
    }


#
# MODULES
#

    # CPU
        function cpu_text() {
            perc=`mpstat | tr ',' '.' | awk '/all/ { print 100.0 - $12 }'`
            perc=`formatPercentage $perc`
            echo " $ICON_CPU$perc% "
        }
        function cpu_click() {
            kitty -e htop
        }

    # RAM
        function ram_text() {
            ram=`free w | awk '/Mem/ {printf("%f", 100*$3/$2)}'`
            ram=`formatPercentage $ram`
            echo " $ICON_RAM$ram% "
        }
        function ram_click() {
            kitty -e htop
        }

    # SWAP
        function swap_text() {
            swap=`free w | awk '/Swap/ {printf("%.2f", 100*$3/$2)}' | sed 's/^0*|0$//g'`
            swap=`formatPercentage $swap`
            echo " $ICON_SWAP$swap% "
        }
        function swap_click() {
            kitty -e htop
        }

    # BATTERY
        function battery_text() {
            infos=`upower -i $(upower -e | grep 'BAT')`

            percentage=`awk '/percentage/ {print $2}' <<< $infos`
            num=`grep -o "[0-9]\+" <<< $percentage`

            if [ "$num" -gt 80 ]; then
                icon=$ICON_BATTERY_80
            elif [ "$num" -gt 60 ]; then
                icon=$ICON_BATTERY_60
            elif [ "$num" -gt 40 ]; then
                icon=$ICON_BATTERY_40
            elif [ "$num" -gt 20 ]; then
                icon=$ICON_BATTERY_20
            else
                if [ "$num" -gt 5 ] && [ ! -f '/tmp/.lowbat' ]; then
                    notify-send "Low battery, Plug Me!" -i /usr/share/icons/hicolor/32x32/status/battery-low.png
                    touch /tmp/.lowbat
                fi
                icon=$ICON_BATTERY_00
            fi

            if [[ ! "$infos" =~ state:[^\n]*discharging ]]; then
                [ -f '/tmp/.lowbat' ] && rm /tmp/.lowbat
                [ -f '/tmp/.nobat' ] && rm /tmp/.nobat
                icon="$ICON_BATTERY_CHARGING$icon"
            else
                if [ "$num" -lt 5 ] && [ ! -f '/tmp/.nobat' ]; then
                    notify-send "No more battery, you gotta do something man" -u critical -i /usr/share/icons/hicolor/32x32/status/battery-empty.png
                    touch /tmp/.nobat
                fi
            fi

            echo -n " $icon $percentage "
        }
        function battery_color() {
            infos=`upower -i $(upower -e | grep 'BAT')`

            percentage=`awk '/percentage/ {print $2}' <<< $infos`
            num=`grep -o "[0-9]\+" <<< $percentage`

            if [[ "$infos" =~ state:[^\n]*discharging ]]; then
                if [ "$num" -lt $THRESHOLD_BATTERY_LOW ]; then
                    color="$COLOR_BATTERY_LOW"
                fi
            else
                if [ "$num" -gt $THRESHOLD_BATTERY_HIGH ]; then
                    color="$COLOR_BATTERY_HIGH"
                fi
            fi

            printf "$color"
        }
        function battery_click() {
            kitty -e bash -c "upower -i `upower -e | grep 'BAT'` | less"
        }

    # TIME
        function time_text() {
            time=`date +"%H:%M"`
            printf " $ICON_TIME$time "
        }
        function time_color() {
            printf $COLOR_TIME
        }
        function time_click() {
            brave "https://calendar.google.com/calendar/r"
        }

    # DOCKER
        function docker_text() {
            printf " $ICON_DOCKER "
        }
        function docker_color() {
            systemctl status docker &> /dev/null
            [ $? -eq 0 ] && printf "$COLOR_DOCKER_ON" || printf "$COLOR_DOCKER_OFF"
        }
        function docker_click() {
            systemctl status docker &> /dev/null
            [ $? -eq 0 ] && systemctl stop docker &> /dev/null || systemctl start docker &> /dev/null
        }




#
# SETUP
#
    echo '{ "version": 1, "click_events": true }'
    echo '[[]'

    while :; do
        json=''
        json+=',['

        for module in $MODULES; do
            json+='{"name":"'$module'", "color": "'`${module}_color`'",   "full_text": "'`${module}_text`'"},'
        done
        json=${json::-1}

        json+=']'

        echo -n "$json" || exit 1

        while read -t 2 line; do
            app=`grep -o '"name":"\w\+"' <<< "$line" | sed 's/^.*:"\|"$//g'`
            ${app}_click
        done
    done
