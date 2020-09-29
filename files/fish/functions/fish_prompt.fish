function fish_prompt

    set saveStatus $status

    if not set -q VIRTUAL_ENV_DISABLE_PROMPT
        set -g VIRTUAL_ENV_DISABLE_PROMPT true
    end

    # \n\[${BACK} ╭─┥ ${SHADOW}\w\$(generateGitContent) ${BACK}┝─┈${NC}\]\n\[${BACK}\] ╰─╼┥\$(getStatusIcon)\[${NC}\] 

    printf "\n $BACK╭─┥ $SHADOW"
    printf '%s' (echo -n (prompt_pwd))

    set branch (git branch --show-current 2> /dev/null)
    if test "$branch" != ""

        # set changes (git diff 3> /dev/null)

        # if test "$changes" != ''
        #     set branch "$branch~"
        # end

        echo -en "$BACK $SEP $SHADOW $branch"
    end

    printf "$BACK ┝─┈\n ╰─╼┥$NC"

    if test $saveStatus = 0
        printf $SPARKLES
    else
        printf $ANGER
    end
    printf " "
end
