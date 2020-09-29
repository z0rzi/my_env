
# Launching aliases
while read line
    echo $line | read alias cmd
    if test -n "$alias"  -a -n "$cmd"
        alias "$alias" "$cmd"
        function \\$alias -V alias
            set args ''
            for arg in $argv;
                set args "$args "(string replace -r -a "[[:space:]*\\\\]" '\\\\\\\\$0' $arg)
            end
            bash -c "$alias $args"
        end
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
