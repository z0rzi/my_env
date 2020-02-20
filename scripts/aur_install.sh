
git_url=$1
dir_name="git$RANDOM"

cd /tmp

git clone $git_url $dir_name

cd $dir_name

makepkg -si

cd /tmp

\rm -rf $dir_name
