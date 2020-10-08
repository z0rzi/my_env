#!/bin/bash

# See https://github.com/i3/i3/blob/next/contrib/trivial-bar-script.sh
#
# For icons: https://fontawesome.com/cheatsheet?from=io

CLICK_LEFT=1
CLICK_MIDDLE=2
CLICK_RIGHT=3
SCROLL_UP=5
SCROLL_DOWN=5

JSON_PARSER="/home/zorzi/.my_env/scripts/parse_json.js"
AIRPLANE_TOOL="/home/zorzi/.my_env/scripts/airplane.sh"

#
# DATA
#
    MODULES='ram swap cpu battery weather airplane docker lock time'

    ICON_CPU='🔥'
    ICON_SWAP='🍩'
    ICON_RAM='🥓'
    ICON_TIME=''
    ICON_DOCKER=''
    ICON_AIRPLANE=''
    ICON_BATTERY_80=''
    ICON_BATTERY_60=''
    ICON_BATTERY_40=''
    ICON_BATTERY_20=''
    ICON_BATTERY_00=''
    ICON_BATTERY_CHARGING='⚡'

    ICON_LOCK_OFF=''
    ICON_LOCK_ON=''
    
    ICON_WEATHER_RAIN='🌧️'
    ICON_WEATHER_RAINSUN='🌦️ '
    ICON_WEATHER_SNOWFLAKE='❄️'
    ICON_WEATHER_SNOW='🌨️'
    ICON_WEATHER_STORM='🌩️'
    ICON_WEATHER_STORMRAIN='⛈️'
    ICON_WEATHER_TORNADO='🌪️'
    ICON_WEATHER_CLOUDY0='☁️'
    ICON_WEATHER_CLOUDY1='⛅'
    ICON_WEATHER_CLOUDY2='🌤️'
    ICON_WEATHER_SUN='☀️'
    ICON_WEATHER_COMET='☄️'
    ICON_WEATHER_NIGHT='🌌'
    ICON_WEATHER_MOON='🌘'


    THRESHOLD_BATTERY_LOW=10
    THRESHOLD_BATTERY_HIGH=95

    COLOR_DISABLED="#999999"

    COLOR_DOCKER_ON="#0399c4"
    COLOR_DOCKER_OFF="$COLOR_DISABLED"

    COLOR_LOCK_ON="#03c499"
    COLOR_LOCK_OFF="$COLOR_DISABLED"

    COLOR_AIRPLANE_ON="#03c499"
    COLOR_AIRPLANE_OFF="$COLOR_DISABLED"

    COLOR_BATTERY_HIGH="#27ae60"
    COLOR_BATTERY_LOW="#e74c3c"

    COLOR_TIME="#eeeeee"

#
# HELPERS
#
    function trim {
        awk '/./ {gsub("^[[:blank:]]*|[[:blank:]]*$", ""); print}'
    }

    function formatPercentage {
        sed -e 's/^0*\([0-9]\+\.\)/\1/' -e 's/\(\..\).*$/\1/' -e 's/\.0*$//' -e 's/\(\.[0-9]*[1-9]\)0*$/\1/' <<< "$1"
    }

    function getPublicIP {
        if [ ! -f "/tmp/.pub_ip" ]; then
            curl ifconfig.me -o /tmp/.pub_ip
        fi

        cat /tmp/.pub_ip | trim
    }

    function getLatLng {
        if [ ! -f "/tmp/.location" ]; then
            curl 'https://iplocation.com/' \
                -o /tmp/.location \
                -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36' \
                --data "ip=$(getPublicIP | trim)" \
                --compressed
        fi

        raw=$(cat /tmp/.location)

        $JSON_PARSER "$raw" "%(|lat) %(|lng)"
    }


#
# MODULES
#

    # CPU
        function cpu_text {
            # perc=`mpstat | tr ',' '.' | awk '/all/ { print 100.0 - $12 }'`
            perc=`iostat -syzc | sed '4p;d' | awk '{print 100.0 - $6}'`
            perc=`formatPercentage $perc`
            echo " $ICON_CPU$perc% "
        }
        function cpu_click {
            kitty -e htop
        }

    # RAM
        function ram_text {
            ram=`free w | awk '/Mem/ {printf("%f", 100*$3/$2)}'`
            ram=`formatPercentage $ram`
            echo " $ICON_RAM$ram% "
        }
        function ram_click {
            kitty -e htop
        }

    # SWAP
        function swap_text {
            swap=`free w | awk '/Swap/ {printf("%.2f", 100*$3/$2)}' | sed 's/^0*|0$//g'`
            swap=`formatPercentage $swap`
            echo " $ICON_SWAP$swap% "
        }
        function swap_click {
            kitty -e htop
        }

    # BATTERY
        function battery_text {
            infos=`upower -i $(upower -e | grep 'BAT')`

            percentage=`awk '/percentage/ {print $2}' <<< $infos`
            num=`grep -o "[0-9]\+" <<< $percentage`
            plugged=`[[ "$infos" =~ state:[^\n]*discharging ]] || echo 1`

            if [ "$num" -gt 80 ]; then
                icon=$ICON_BATTERY_80
            elif [ "$num" -gt 60 ]; then
                icon=$ICON_BATTERY_60
            elif [ "$num" -gt 40 ]; then
                icon=$ICON_BATTERY_40
            elif [ "$num" -gt 20 ]; then
                icon=$ICON_BATTERY_20
            else
                if [ ! "$plugged" ] && [ "$num" -gt 5 ] && [ ! -f '/tmp/.lowbat' ]; then
                    touch /tmp/.lowbat
                    notify-send "Low battery, Plug Me!" -i /usr/share/icons/hicolor/32x32/status/battery-low.png
                fi
                icon=$ICON_BATTERY_00
            fi

            if [ "$plugged" ]; then
                [ -f '/tmp/.lowbat' ] && rm /tmp/.lowbat
                [ -f '/tmp/.nobat' ] && rm /tmp/.nobat
                icon="$ICON_BATTERY_CHARGING$icon"
            else
                if [ "$num" -lt 5 ] && [ ! -f '/tmp/.nobat' ]; then
                    touch /tmp/.nobat
                    notify-send "No more battery, you gotta do something man" -u critical -i /usr/share/icons/hicolor/32x32/status/battery-empty.png
                fi
            fi

            echo -n " $icon $percentage "
        }
        function battery_color {
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
        function battery_click {
            kitty -e bash -c "upower -i `upower -e | grep 'BAT'` | less"
        }

    # TIME
        function time_text {
            time=`date +"%H:%M"`
            printf " $ICON_TIME$time "
        }
        function time_color {
            printf $COLOR_TIME
        }
        function time_click {
            if [ "$1" = "$CLICK_RIGHT" ]; then
                export LC_TIME='en_US.UTF-8'
                notify-send "`date +'%d / %m / %Y'`"  "`date +'%A %d of %B, %Y'`" -t 5000
                return
            fi

            $BROWSER "https://calendar.google.com/calendar/r" > /dev/null &
        }

    # LOCK
        function lock_is_on {
            if [ ! -f "/tmp/.xautolock" ]; then
                xautolock -enable
                printf '1' > /tmp/.xautolock
            fi
            cat /tmp/.xautolock
        }
        function lock_text {
            if [ "`lock_is_on`" ]; then
                printf " $ICON_LOCK_ON "
            else
                printf " $ICON_LOCK_OFF "
            fi
        }
        function lock_color {
            [ "`lock_is_on`" ] && printf "$COLOR_LOCK_ON" || printf "$COLOR_LOCK_OFF"
        }
        function lock_click {
            if [ "`lock_is_on`" ]; then
                xautolock -disable
                printf "" > /tmp/.xautolock
            else
                xautolock -enable
                printf "1" > /tmp/.xautolock
            fi
        }

    # AIRPLANE
        function airplane_text {
            printf " $ICON_AIRPLANE "
        }
        function airplane_color {
            status=`$AIRPLANE_TOOL status`
            [ "$status" = "on" ] && printf "$COLOR_AIRPLANE_ON" || printf "$COLOR_AIRPLANE_OFF"
        }
        function airplane_click {
            gksu $AIRPLANE_TOOL toggle &> /dev/null
        }

    # DOCKER
        function docker_text {
            printf " $ICON_DOCKER "
        }
        function docker_color {
            systemctl status docker &> /dev/null
            [ $? -eq 0 ] && printf "$COLOR_DOCKER_ON" || printf "$COLOR_DOCKER_OFF"
        }
        function docker_click {
            if [ "$1" = "$CLICK_RIGHT" ]; then
                notify-send "Running containers:" "`docker ps`" -t 5000
                return
            fi
            systemctl status docker &> /dev/null
            [ $? -eq 0 ] && systemctl stop docker &> /dev/null || systemctl start docker &> /dev/null
        }

    # WEATHER
        function getWeather {
            now=`date +%y%m%d%H%M`
            if [ ! -f "/tmp/.weather_check_time" ] || [ ! -f "/tmp/.weather" ]; then
                echo $now > /tmp/.weather_check_time
                before=0
            else
                before=`cat /tmp/.weather_check_time | trim`
            fi

            if [ "$before" -lt $((now - 60)) ]; then
                # Every 60 mins
                echo $now > /tmp/.weather_check_time
                read lat lng <<< "$(getLatLng)"

                # Api from https://rapidapi.com/ClimaCell/api/climacell?endpoint=apiendpoint_d775527a-c5c0-44f6-9c34-9c943f7b8131
                curl --request GET \
                    -o /tmp/.weather \
                    --url 'https://climacell-microweather-v1.p.rapidapi.com/weather/realtime?unit_system=si&fields=temp,weather_code,sunrise,sunset&lat='$lat'&lon='$lng \
                    --header 'x-rapidapi-host: climacell-microweather-v1.p.rapidapi.com' \
                    --header 'x-rapidapi-key: bc4ad2bf7bmsh6cedd1de54adf93p11ad86jsneae68ced3020'
            fi
            $JSON_PARSER "`cat /tmp/.weather`" "%(|temp|value) %(|weather_code|value) %(|sunrise|value) %(|sunset|value)" | trim
        }
        function weather_getIcon {
            case "$1" in
                "rain" | "rain_heavy" | "freezing_rain" | "freezing_rain_light" | "freezing_rain_heavy" | "freezing_drizzle" | "drizzle")
                    icon=$ICON_WEATHER_RAIN
                    ;;
                "rain_light")
                    icon=$ICON_WEATHER_RAINSUN
                    ;;
                "snow" | "snow_heavy" | "snow_light" | "flurries")
                    icon=$ICON_WEATHER_SNOW
                    ;;
                "ice_pellets" | "ice_pellets_heavy" | "ice_pellets_light" | "tstorm")
                    icon=$ICON_WEATHER_STORMRAIN
                    ;;
                "fog" | "fog_light" | "cloudy" | "mostly_cloudy")
                    icon=$ICON_WEATHER_CLOUDY0
                    ;;
                "partly_cloudy" | "partly_cloudy_night")
                    icon=$ICON_WEATHER_CLOUDY1
                    ;;
                "mostly_clear" | "mostly_clear_night")
                    icon=$ICON_WEATHER_CLOUDY2
                    ;;
                "clear" | "clear_night")
                    icon=$ICON_WEATHER_SUN
                    ;;
                *)
                    icon='❓'
                    ;;
            esac
            printf $icon
        }
        function weather_text {
            read temp code _ <<< `getWeather`
            icon=`weather_getIcon $code`
            printf " $icon $temp° "
        }
        function weather_click {
            if [ "$1" = "$CLICK_RIGHT" ]; then
                read temp code raw_rise raw_set <<< `getWeather`

                icon=`weather_getIcon $code`
                rise=`date -d "$raw_rise" +%H:%M`
                set=`date -d "$raw_set" +%H:%M`
                notify-send "$icon $temp° | $code" "🌅 $rise  ➜  $set 🌇" -t 5000
                return
            fi
            rm /tmp/.weather
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
            color=`${module}_color 2> /dev/null`
            text=`${module}_text 2> /dev/null`
            json+='{"name":"'$module'", "color": "'$color'",   "full_text": "'$text'"},'
        done
        json=${json::-1}

        json+=']'

        echo -n "$json" || exit 1

        while read -t 2 line; do
            if [[ "$line" =~ ^, ]]; then
                line=${line:1}
            fi
            read name button <<< "`$JSON_PARSER $line '%(|name) %(|button)'`"
            ${name}_click $button
        done
    done
