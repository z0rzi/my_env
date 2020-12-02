#!/bin/bash
[ "$EDITOR" ] && editor=$EDITOR || editor="/usr/bin/nvim"

unlimited_retries=""

while [ $# -gt 0 ]; do
    if [[ "$1" =~ ^- ]]; then
        case $1 in
            "--unlimited-retries"|"-ur")
                unlimited_retries=1
                ;;
        esac
    else
        OUTPUT=$1
    fi
    shift
done

HASH=`sed -s 's/[^a-zA-Z]\+/_/g' <<< "$OUTPUT"`
WRITER="/tmp/.ds-${HASH}.sh"
LOG="/tmp/.ds-${HASH}.log"
FRAGMENT="/tmp/.ds-${HASH}.frag"
CURL_LOG="/tmp/curl_logs-${HASH}.tmp"

if [ ! "$OUTPUT" ]; then
    echo "USAGE = 'download_streaming.sh <OUTPUT_FILE_NAME> [-ur | --unlimited-retries]'"
    exit 1
fi


echo -e "# Paste the curl link below, replace the counter, if any, by '{}':\n\n" > $WRITER
$editor $WRITER

cmd=`sed \
    -e '/^\s*$/d' \
    -e '/^\s*#.*$/d' \
    -e 's/\\\s*$//g' \
    -e 's/curl/curl -v --connect-timeout 10 /' $WRITER | tr '\n' ' '`

if [ ! "$cmd" ]; then
    echo "No command provided!"
    exit 1
fi

read -p "Counter starting at [1]: " cnt
while ! [[ "$cnt" =~ ^[0-9]*$ ]]; do
    read -p "Counter starting at [1]: " cnt
done
cnt=${cnt:-1}

echo -e "\n\n [START] - '$PWD/$OUTPUT'" >> $LOG
while :; do
    cnt_cmd=`sed "s/{}/$cnt/g" <<< "$cmd"`

    retry=1
    ok=""
    while [ ! "$ok" ]; do
        if [ $retry -gt 10 ] && [ ! "$unlimited_retries" ]; then
            echo "Too many retries, Stopping."
            echo "See '$LOG' for more infos"
            exit 1
        fi
        echo "[ CNT ] - $cnt x $retry" >> $LOG
        echo "$cnt"
        eval "$cnt_cmd > $FRAGMENT 2> $CURL_LOG"
        cat $CURL_LOG >> $LOG

        if [ $? -ne 0 ] && [ $retry -lt 3 ]; then
            echo "[ERROR] - Error from eval - retry #$retry" >> $LOG
            retry=$((retry+1))
            continue
        fi

        errCode=`grep '< HTTP.* 2' $CURL_LOG`
        if [ ! "$errCode" ]; then
            echo "[ERROR] - HTTP code not 200" >> $LOG
            retry=$((retry+1))
            continue
        fi
        
        ok=1
    done

    cat $FRAGMENT >> $OUTPUT

    cnt=$((cnt+1))
done
