#!/bin/bash

while read _ id cmd; do
    if [ "$cmd" = "fish" ] || [ "$cmd" = "bash" ]; then
        echo killing pane $id
        tmux kill-pane -t $id
    fi
done <<< `tmux list-panes -s -F "#{window_active}#{pane_active} #{pane_id} #{pane_current_command}" | grep -v "^11"`
