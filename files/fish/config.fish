
# Launching aliases
while read line
    echo $line | read alias cmd
    if test -n "$alias"  -a -n "$cmd"
        alias "$alias" "$cmd"
        if test "$alias" = "rm"
            continue
        end
        function \\$alias -V alias
            set args ''
            for arg in $argv;
                set args "$args "(bash -c "printf '%q' '$arg'")
            end
            bash -c "$alias $args"
        end
    end
end < $HOME/.config/fish/aliases


if ! string match -n "scripts" "$PATH"
    set PATH $PATH:$HOME/.my_env/scripts/:$HOME/.local/bin
end

export TERM=xterm

# [ -n "$TMUX" ] && export TERM=tmux-256color
# Launching TMUX
# if test ! "$TMUX"
#     tmux has-session 2&> /dev/null
#     if test $status -eq 0
#         # exec tmux attach
#         exec tmux
#     else
#         exec tmux
#     end
# end
