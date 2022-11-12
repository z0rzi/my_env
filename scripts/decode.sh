#!/bin/bash

if [ $# -eq 0 ]; then
    echo "This script is used to decode the file names (e.g. for files with accents comming from windows OS)"
    echo "It works in 2 steps :"
    echo "  1. Find the encoding format"
    echo "  2. Use the created script to decode your files"
    echo
    echo "USAGE = 'decode.sh <file>'"
    exit 1
fi

okchars="0123456789qwertyuiopasdfghjklzxcvbnm -_./,'"
okchars="$okchars${okchars^^}"

encodings=`iconv -l | sed -e 's/, /\n/g' -e 's/\///g'`

found=''
for enc in $encodings; do
    for filepath in "$@"; do
        filename=${filepath##*/}
        res=`iconv -f $enc -t utf8 <<< "$filename" 2> /dev/null | grep 'é\|à\|è'`
        if [ $? -eq 0 ] && [[ "$res" =~ [a-z/]{3} ]]; then
            echo -e "encoding = $enc"
            echo -e "$res\n"
        fi
    done
    [ "$found" ] && break;
done

ans=
while [ "$ans" != 'y' ] && [ "$ans" != 'n' ]; do
    read -p "Did you find a good encoding ? (y/n) " ans
done

if [ "$ans" = "y" ]; then
    read -p "Which one ? " enc

    echo '#!/bin/bash' > /tmp/translate
    echo '' >> /tmp/translate
    echo 'okchars="0123456789qwertyuiopasdfghjklzxcvbnméàèêâ -_./,'"'"'"' >> /tmp/translate
    echo 'okchars="$okchars${okchars^^}"' >> /tmp/translate
    echo '' >> /tmp/translate
    echo 'while [ $# -gt 0 ]; do' >> /tmp/translate
    echo '    filepath="$1"' >> /tmp/translate
    echo '    [[ "$filepath" != *"/"* ]] && filepath="./$filepath"' >> /tmp/translate
    echo '    [[ "$filepath" == *"/" ]] && filepath=${filepath::-1}' >> /tmp/translate
    echo '    filename=${filepath##*/}' >> /tmp/translate
    echo '    filedir=${filepath%/*}' >> /tmp/translate
    echo '' >> /tmp/translate
    echo '    okname=1' >> /tmp/translate
    echo '    for (( i=0 ; i<${#filename} ; i++ )); do' >> /tmp/translate
    echo '        char=${filename:$i:1}' >> /tmp/translate
    echo '        [[ "$okchars" != *"$char"* ]] && okname=' >> /tmp/translate
    echo '    done' >> /tmp/translate
    echo '    if [ ! "$okname" ]; then' >> /tmp/translate
    echo '        newname=$(iconv -f '$enc' -t utf8 <<< "$filename")' >> /tmp/translate
    echo '        echo "$filename => $newname"' >> /tmp/translate
    echo '        mv "$filepath" "$filedir/$newname" 2> /dev/null' >> /tmp/translate
    echo '    fi' >> /tmp/translate
    echo '    shift' >> /tmp/translate
    echo 'done' >> /tmp/translate

    chmod u+x /tmp/translate

    echo 'A translation script has been created, use it as follow :'
    echo '    /tmp/translate <file>'
else
    echo "No encoding matching your files could be found..."

    matches=''
    for filepath in "$@"; do
        buff=
        for (( i=0; i<${#filepath}; i++ )); do
            cara=${filepath:$i:1}
            if [[ "$okchars" == *"$cara"* ]]; then
                if [ "$buff" ]; then
                    if [[ "$matches" != *"$buff"* ]]; then
                        echo $filepath
                        read -p "What does '$buff' stand for ? " trans
                        matches="$matches $buff:$trans"
                    fi
                    buff=
                fi
                continue
            fi

            echo $cara
            buff=$buff$cara
        done
    done
    echo $matches
    for filepath in "$@"; do
        [[ "$filepath" == *"/" ]] && filepath=${filepath::-1}
        filename=${filepath##*/}
        filedir=${filepath%/*}

        for match in $matches; do
            lhs=${match%:*}
            rhs=${match#*:}
            filename=`echo $filename | sed "s/$lhs/$rhs/g"`
        done
    done

    echo '#!/bin/bash' > /tmp/translate

    echo 'matches="'$matches'"' >> /tmp/translate

    echo 'while [ $# -gt 0 ]; do' >> /tmp/translate
    echo '    filepath="$1"' >> /tmp/translate
    echo '    [[ "$filepath" != *"/"* ]] && filepath="./$filepath"' >> /tmp/translate
    echo '    [[ "$filepath" == *"/" ]] && filepath=${filepath::-1}' >> /tmp/translate
    echo '    filename=${filepath##*/}' >> /tmp/translate
    echo '    filedir=${filepath%/*}' >> /tmp/translate

    echo '    newname=$filename' >> /tmp/translate
    echo '    for match in $matches; do' >> /tmp/translate
    echo '        lhs=${match%:*}' >> /tmp/translate
    echo '        rhs=${match#*:}' >> /tmp/translate
    echo '        newname=`echo $newname | sed "s/$lhs/$rhs/g"`' >> /tmp/translate
    echo '    done' >> /tmp/translate
    echo '    shift' >> /tmp/translate

    echo '    echo "$filename => $newname"' >> /tmp/translate
    echo '    mv "$filepath" "$filedir/$newname"' >> /tmp/translate
    echo 'done' >> /tmp/translate

    chmod u+x /tmp/translate

    echo 'A translation script has been created, use it as follow :'
    echo '    /tmp/translate <file>'
fi
