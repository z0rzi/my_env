
# Launching aliases
while read line
    echo $line | read alias cmd
    if test -n "$alias"  -a -n "$cmd"
        alias "$alias" "$cmd"
        function \\$alias -V alias
            set args ''
            for arg in $argv;
                set -l formatted_arg (string replace -r -a "[[:space:]*\\\\]" '\\\\\\\\$0' $arg)
                if test -n formatted_arg
                    set args "$args $arg"
                else
                    set args "$args $formatted_arg"
                end
            end
            bash -c "$alias $args"
        end
    end
end < $HOME/.config/fish/aliases


if ! string match -n "scripts" "$PATH"
    set PATH $PATH:$HOME/.my_env/scripts/:$HOME/.local/bin
end

[ -n "$TMUX" ] && export TERM=tmux-256color
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
