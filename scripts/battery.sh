#!/bin/bash

upower -i $(upower -e | grep 'BAT') | grep -E "state|time\ to\ \w+|percentage"
