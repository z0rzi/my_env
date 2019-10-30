#
# ~/.bashrc
#

[[ $- != *i* ]] && return

colors() {
	local fgc bgc vals seq0

	printf "Color escapes are %s\n" '\e[${value};...;${value}m'
	printf "Values 30..37 are \e[33mforeground colors\e[m\n"
	printf "Values 40..47 are \e[43mbackground colors\e[m\n"
	printf "Value  1 gives a  \e[1mbold-faced look\e[m\n\n"

	# foreground colors
	for fgc in {30..37}; do
		# background colors
		for bgc in {40..47}; do
			fgc=${fgc#37} # white
			bgc=${bgc#40} # black

			vals="${fgc:+$fgc;}${bgc}"
			vals=${vals%%;}

			seq0="${vals:+\e[${vals}m}"
			printf "  %-9s" "${seq0:-(default)}"
			printf " ${seq0}TEXT\e[m"
			printf " \e[${vals:+${vals+$vals;}}1mBOLD\e[m"
		done
		echo; echo
	done
}

[ -r /usr/share/bash-completion/bash_completion ] && . /usr/share/bash-completion/bash_completion

use_color=true

# Set colorful PS1 only on colorful terminals.
# dircolors --print-database uses its own built-in database
# instead of using /etc/DIR_COLORS.  Try to use the external file
# first to take advantage of user additions.  Use internal bash
# globbing instead of external grep binary.
safe_term=${TERM//[^[:alnum:]]/?}   # sanitize TERM
match_lhs=""
[[ -f ~/.dir_colors   ]] && match_lhs="${match_lhs}$(<~/.dir_colors)"
[[ -f /etc/DIR_COLORS ]] && match_lhs="${match_lhs}$(</etc/DIR_COLORS)"
[[ -z ${match_lhs}    ]] \
	&& type -P dircolors >/dev/null \
	&& match_lhs=$(dircolors --print-database)
[[ $'\n'${match_lhs} == *$'\n'"TERM "${safe_term}* ]] && use_color=true

if ${use_color} ; then
	# Enable colors for ls, etc.  Prefer ~/.dir_colors #64489
	if type -P dircolors >/dev/null ; then
		if [[ -f ~/.dir_colors ]] ; then
			eval $(dircolors -b ~/.dir_colors)
		elif [[ -f /etc/DIR_COLORS ]] ; then
			eval $(dircolors -b /etc/DIR_COLORS)
		fi
	fi

    # PS1='\[\033[01;31m\][\h\[\033[01;36m\] \w\[\033[01;31m\]]\$\[\033[00m\] '
    PS1="\[\e[1m\e[92m\][ \[\e[0m\]\w \[\e[92m\]]\[\e[\[\$([ \$? -eq 0 ] && echo 92 || echo 31)m\] ❱ \[\e[0m\]"

	alias ls='ls --color=auto'
	alias grep='grep --colour=auto'
	alias egrep='egrep --colour=auto'
	alias fgrep='fgrep --colour=auto'
    alias copy='xclip -sel clip'
    alias ccat='pygmentize -g -O style=colorful,linenos=1'

else
	if [[ ${EUID} == 0 ]] ; then
		# show root@ when we don't have colors
		PS1='\u@\h \w \$ '
	else
		PS1='\u@\h \w \$ '
	fi
fi

unset use_color safe_term match_lhs sh

alias rm="gio trash"

xhost +local:root > /dev/null 2>&1

complete -cf sudo

# Bash won't get SIGWINCH if another process is in the foreground.
# Enable checkwinsize so that bash will check the terminal size when
# it regains control.  #65623
# http://cnswww.cns.cwru.edu/~chet/bash/FAQ (E11)
shopt -s checkwinsize

shopt -s expand_aliases

# Enable history appending instead of overwriting.  #139609
shopt -s histappend


PATH=$PATH:$HOME/.my_env/scripts/:


alias vim="nvim"
alias vi="nvim"
alias minivim=".vim -u NONE"
alias tinyvim=".vim -u NONE"
alias vimtiny="nvim -u NONE"

alias bye='exit'
alias byebye='shutdown now'

alias ls='ls --color'
alias ll='ls -l'
alias la='ls -a'
alias lla='ls -la'
alias lls='clear;ls'

alias color="grep -C 100000"

alias git='git_wrapper.sh'

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/home/zorzi/Projects/my_app_engine/google-cloud-sdk/path.bash.inc' ]; then . '/home/zorzi/Projects/my_app_engine/google-cloud-sdk/path.bash.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/home/zorzi/Projects/my_app_engine/google-cloud-sdk/completion.bash.inc' ]; then . '/home/zorzi/Projects/my_app_engine/google-cloud-sdk/completion.bash.inc'; fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
