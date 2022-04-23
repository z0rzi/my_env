#!/bin/bash

if [ $# -lt 1 ]; then
    echo 'USAGE="whatsapp.sh <phone-number>"'
    exit 1
fi

vivaldi "https://web.whatsapp.com/send?phone=${1}&submit=Continue" 2> /dev/null

# text="Hola :)\n\n"
# text=$text"He encontrado su anuncio en Idealista (${2})\n\n"
# text=$text"Estoy muy interesado, pero solo me quedaré en Valencia por 3 meses (desde Marzo hasta Mayo), eso sería un problema? 😕\n"
# text=$text"Sino, me gustaria hacer una visita, lo antes possible"

# echo -e "$text" | xclip -sel clip
# echo -e "$text"
# echo
# echo "^^ copied to clipboard ^^"
