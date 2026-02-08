#!/bin/bash

# check corn job already exists or add it
(crontab -l | grep -q 'gitops.sh') || (crontab -l ; echo "*/5 * * * * /bin/bash $(pwd)/gitops.sh >> $(pwd)/gitops.log 2>&1") | crontab -

# update git repo
git pull

# call docker compose script
./docker_compose.sh
