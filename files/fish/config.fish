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

if ! string match -r "scripts" "$PATH"
    set PATH $PATH:$HOME/.local/bin:$HOME/.local/bin/custom
end

export TERM=xterm

fzf_configure_bindings --directory=\cf
