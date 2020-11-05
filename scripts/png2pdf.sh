#!/bin/bash

if [ $# -lt 1 ]; then
    echo "USAGE = 'png2pdf.sh <input png file> [--quality=(low|middle|high)]' [--no-compress]"
    exit
fi

file=''
quality=ebook
should_compress=1
while [ $# -gt 0 ]; do
    if [ -f "$1" ]; then
        file=$1
    elif [ "$1" = "--no-compress" ]; then
        should_compress=''
    elif [[ "$1" =~ ^--quality= ]]; then
        case "`cut -d= -f2 <<< $1`" in
            "low")
                quality='screen'
                ;;
            "middle")
                quality='ebook'
                ;;
            "high")
                quality='prepress'
                ;;
        esac
    fi
    shift
done

if [ ! "$file" ]; then
    echo "No valid files provided!"
    exit
fi

if [[ ! "$file" =~ \.png$ ]]; then
    echo "Provided file is not a png!"
    exit
fi

noext_name=`sed -e 's/\.png$//' <<< "$file"`

# requires Imagemagik
convert $file /tmp/._.pdf

if [ "$should_compress" ]; then
    # Requires ghostscript
    gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/$quality -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${noext_name}.pdf /tmp/._.pdf
    rm -rf /tmp/._.pdf
else
    mv /tmp/._.pdf ${noext_name}.pdf
fi

echo "${noext_name}.pdf created."
