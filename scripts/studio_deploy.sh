#!/bin/bash

GH_USERNAME="z0rzi"
DOCKER_IMAGE_NAME="z0rzi/studio:latest"
STUDIO_DIR="$HOME/Work/StoryScript/studio"


# Colors
GREEN='\033[1;32m'
BLUE='\033[1;35m'
RED='\033[1;31m'
NC='\033[0m'

function logMsg() {
    echo -e "${BLUE}\t➤ $@${NC}"
}

function helpError() {
    if [ $# -gt 0 ]; then
        echo -e "\n${RED}$@${NC}\n"
    fi
    echo
    echo -e "${RED}USAGE${NC} = '$0' ${BLUE}<Method>${NC} (<args>) ${GREEN}--env=<Env Name>${NC} (--user=<GH Username>)"
    echo
    echo
    echo -e "Method can be:"
    echo
    echo -e "  - ${BLUE}whitelist${NC}"
    echo -e "      ⤷ Whitelists a user on a specific dev environment"
    echo
    echo -e "  - ${BLUE}deploy${NC}"
    echo -e "      ⤷ Creates a container image from the studio branch you're currently on,"
    echo -e "        deploys this image on DockerHub, and 'tells' the pod to load this image"
    echo
    echo -e "  - ${BLUE}url${NC}"
    echo -e "      ⤷ Gives you the URL to access a dev env"
    echo
    echo -e "  - ${BLUE}usernames${NC}"
    echo -e "      ⤷ Gives you a reminder of the Github usernames of all members of the team"
    echo

    exit
}

function prompt_gh_usernames() {
    echo -e
    echo -e "Usernames:"
    echo -e "  - ${GREEN}stevepeak${NC} <Steve Peaks>"
    echo -e "  - ${GREEN}Arinono${NC} <Aurélien Arino>"
    echo -e "  - ${GREEN}JeanBarriere${NC} <Jean Barrière>"
    echo -e "  - ${GREEN}williammartin${NC} <William Martin>"
    echo -e "  - ${GREEN}anukul${NC} <Anukul Sangwan>"
    echo -e "  - ${GREEN}wilzbach${NC} <Sebastian Wilzbach>"
    echo -e "  - ${GREEN}z0rzi${NC} <Baptiste Zorzi>"
    echo -e
}

function whitelist() {
    gcloud container clusters get-credentials "$1" --region europe-west4 --project storyscript-ci && \
    curl -vvv -X PUT https://auth.$1.storyscript-ci.com/allowlist/$GH_USERNAME -H 'Authorization: allowlist-token' && \
    echo -e "${GREEN}Successfully whitelisted ${BLUE}$GH_USERNAME${NC}" || \
    echo -e "${RED}ERROR${NC}"
}

function create_and_push_container() {
    [ -d "$STUDIO_DIR" ] || ( echo -e "\n${RED}Error${NC}: Studio directory not found!\n" && exit )
    cd $STUDIO_DIR

    logMsg "Stashing Git changes"
    git stash

    logMsg "Turning on Docker and creating the container"
    systemctl status docker || sudo systemctl start docker
    docker rmi $DOCKER_IMAGE_NAME
    docker build -f .docker/Dockerfile.docker -t "$DOCKER_IMAGE_NAME" .
    
    logMsg "Poping the stashed git changes"
    git stash pop

    logMsg "Pushing the container to DockerHub"
    docker push $DOCKER_IMAGE_NAME || ( echo -e "\n${RED}Error${NC}: It seems we couldn't push, are you logged in docker hub? try '${BLUE}docker login${NC}'\n" && exit )
}

function load_container_in_pod() {
    
    dockerhub_repo_name="z0rzi\/studio:latest"

    logMsg "Getting values from helm"
    helm get values storyscript > /tmp/_.yml

    logMsg "Replacing the studio repo by my repo ($DOCKER_IMAGE_NAME) in the yml file"
    line=`grep -n "^studio:" /tmp/_.yml | cut -d: -f1`
    line=$((line+1))
    sed -e "${line}s/: .*$/: ${dockerhub_repo_name}/" /tmp/_.yml > /tmp/__.yml

    logMsg "Replacing the container"
    helm upgrade -f /tmp/__.yml storyscript storyscript/storyscript
}


#
# Reading args
#
method=""
while [ $# -gt 0 ]; do
    if [[ $1 =~ ^--env= ]]; then
        env_name=`sed 's/^.*=//' <<< $1`
    elif [[ $1 =~ ^--user= ]]; then
        GH_USERNAME=`sed 's/^.*=//' <<< $1`
    elif [ ! "$method" ]; then
        method=$1
    else
        args="$args $1"
    fi
    shift
done

[ "$method" ] || helpError "Missing Method!"
[ "$env_name" ] || helpError "Missing ENV Name"


#
# Launching the right function
#
if [ "$method" = "whitelist" ]; then
    whitelist $env_name

elif [ "$method" = "usernames" ]; then
    prompt_gh_usernames

elif [ "$method" = "url" ]; then
    echo
    echo -e "   http://auth.${BLUE}${env_name}${NC}.storyscript-ci.com/login?username=${GREEN}${GH_USERNAME}${NC}"
    echo

elif [ "$method" = "deploy" ]; then

    create_and_push_container
    load_container_in_pod


    # To check for errors:
    #     ⤷ kubectl get pods
    #     ⤷ kubctl describe pod <POD_ID>
    #     ⤷ kubectl delete pod <POD_ID>
    #     ⤷ helm upgrade --reuse-values --recreate-pods storyscript storyscript/storyscript -> Deletes all the pods, and recreate them
fi
