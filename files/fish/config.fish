
# Launching aliases
while read line
    echo $line | read alias cmd
    if test -n "$alias"  -a -n "$cmd"
        alias "$alias" "$cmd"
        eval "function \\\\$alias; bash -c \"$alias \$argv\"; end"
    end
end < $HOME/.config/fish/aliases


set PATH $PATH:$HOME/.my_env/scripts/:$HOME/.cargo/bin

# Launching TMUX
if test ! "$TMUX"
    tmux has-session 2&> /dev/null
    if test $status -eq 0
        # exec tmux attach
        exec tmux
    else
        exec tmux
    end
end

# Displaying todo after noon!
# set last_term_time (cat /tmp/last-term-time 2> /dev/null)
# set noon (date +'%Y%m%d')"120000"
# set this_term_time (date +"%Y%m%d%H%M%S")
# if test \( -z "$last_term_time" \) -o \( "$last_term_time" -lt "$noon" -a "$this_term_time" -gt "$noon" \)
#     todo
# end
# echo $this_term_time > /tmp/last-term-time
