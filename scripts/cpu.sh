#!/bin/bash

( [ "$1" = "--all" ] || [ "$1" = "full" ] ) && ps -eo pcpu,pid,user,command | grep -v "CPU" | sort -n || ps -eo pcpu,pid,user,comm | grep -v "CPU" | sort -n 
