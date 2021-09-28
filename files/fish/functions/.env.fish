function .env
	if test "$argv"
		for i in (cat $argv)
			set arr (echo $i | sed 's/=/\n/')
			set -gx $arr[1] $arr[2]
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
