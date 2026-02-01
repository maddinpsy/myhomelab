#!/bin/bash

# pull current repo and start again if any changes
if git pull
then
    echo "No changes in the repo"
else
    echo "Changes detected in the repo, restarting script"
    exec /bin/bash "$(pwd)/docker_gitops.sh"
fi
echo new stuffffffffffffffffffffffff


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
