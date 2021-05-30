#!/bin/bash
# based on a script from http://invisible-island.net/xterm/xterm.faq.html
# http://stackoverflow.com/questions/2575037/how-to-get-the-cursor-position-in-bash
exec < /dev/tty
oldstty=$(stty -g)
stty raw -echo min 0
# on my system, the following line can be replaced by the line below it
tput u7 > /dev/tty
IFS=';' read -r -d R -a pos
stty $oldstty
# change from one-based to zero based so they work with: tput cup $row $col
cur_row=$((${pos[0]:2} - 1))    # strip off the esc-[
cur_col=$((${pos[1]} - 1))

term_lines=$(tput lines)
term_cols=$(tput cols)

echo "{"
echo "  \"terminal\": {"
echo "    \"lines\": $term_lines,"
echo "    \"cols\": $term_cols"
echo "  },"
echo "  \"cursor\": {"
echo "    \"line\": $cur_row,"
echo "    \"col\": $cur_col"
echo "  }"
echo "}"

