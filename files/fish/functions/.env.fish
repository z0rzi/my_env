function .env
    if test "$argv"
        for line in (cat $argv)
            echo $line
            if test -z (string match '#*' $line)
                set arr (echo $line | sed 's/=/\n/')
                set -gx $arr[1] $arr[2]
            end
        end
    else
        set path $PWD
        while test "$PWD" != "/"
            if test -e "$PWD/.env"
                echo "'.env' file found at '$PWD'"
                .env "$PWD/.env"
            end
            cd ..
        end
        cd $path
    end
end
