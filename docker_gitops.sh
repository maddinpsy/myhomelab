#!/bin/bash

# pull current repo 
echo checking for updates...
git fetch
if ! git diff origin/docker docker --exit-code 
then
    echo changes detected, updating...
    git pull origin dockerexec 
    echo restarting script...
    ./$0
else
    echo no changes detected
fi

# check corn job already exists or add it
(crontab -l | grep -q 'docker_gitops.sh') || (crontab -l ; echo "*/5 * * * * /bin/bash $(pwd)/docker_gitops.sh >> $(pwd)/docker_gitops.log 2>&1") | crontab -

# add docker packge repo if not exists
if ! grep -q "^deb .\+download.docker.com" /etc/apt/sources.list /etc/apt/sources.list.d/*; then
    curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
fi

# update apt and install docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# install tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# login to tailscale
sudo tailscale up

# run docker compose
docker compose -f docker-compose.yml up -d --remove-orphans
