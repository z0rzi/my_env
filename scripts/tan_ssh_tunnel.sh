#!/bin/bash

out_port=8989

# 8989 ----> 3306

echo "openning a tunnel on port from 127.0.0.1:8989 to 35.187.252.208:3306"

ssh traveladsnetwork@35.187.252.208 -p 31613 -L 8989:127.0.0.1:3306 -N
