#!/bin/bash
# Run from your local machine to push docker config files to VPS
VPS="root@195.179.193.43"
DOCKER_DIR="/docker/command-dashboard"

ssh $VPS "mkdir -p $DOCKER_DIR"
scp deploy/docker/docker-compose.yml $VPS:$DOCKER_DIR/docker-compose.yml
scp deploy/docker/nginx-frontend.conf $VPS:$DOCKER_DIR/nginx-frontend.conf

echo "Files pushed. Now run on VPS:"
echo "  docker compose -f $DOCKER_DIR/docker-compose.yml down"
echo "  docker compose -f $DOCKER_DIR/docker-compose.yml up -d"
