#!/bin/bash

sudo sleep 0.1  # To get auth
xflock4
sleep 3
echo disk | sudo tee /sys/power/state
