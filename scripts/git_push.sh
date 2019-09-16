#!/bin/bash

git push

gitPath=`git rev-parse --show-toplevel`

[ -f "$gitPath/.git/hooks/post-push" ] && $gitPath/.git/hooks/post-push

echo $gitPath/.git/hooks/post-push
