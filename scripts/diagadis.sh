#!/bin/bash


if [ $# -ne 1 ]; then
    echo "USAGE = 'diagadis.sh <front|applicatif|algorithme>'"
    exit 1
fi

case $1 in
    "front")
        echo "LOCAL: "
        echo "    export NODE_OPTIONS=--max-old-space-size=8192"
        echo "    export API_URL=http://baptiste-zorzi.com"
        echo ""
        echo "    yarn build && \\"
        echo "        scp -r ./dist/ baptiste-zorzi.com:~/server/front/"
        echo ""
        echo "REMOTE:"
        echo "    npx angular-http-server -p 4200 --path dist/"
        echo ""
        ;;

    "applicatif")
        echo "REMOTE:"
        echo "    yarn start"
        echo ""
        ;;

    "algorithme")
        echo "REMOTE:"
        echo "    export IP=baptiste-zorzi.com"
        echo "    yarn start"
        echo ""
        ;;
esac
