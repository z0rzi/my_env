#!/bin/bash

lang=`ibus engine`

if [ "$lang" = "mozc-jp" ]; then
	ibus engine xkb:us::eng
else
	ibus engine mozc-jp
fi
