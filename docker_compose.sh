# stop the script if any command fails
set -e

# add docker package repo if not exists
if ! grep -q "^deb .\+download.docker.com" /etc/apt/sources.list /etc/apt/sources.list.d/*; then
    curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
fi

# update apt and install docker
if ! [ -x "$(command -v docker)" ]; then
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# install sops
if ! [ -x "$(command -v sops)" ]; then
  curl -LO https://github.com/getsops/sops/releases/download/v3.11.0/sops-v3.11.0.linux.arm64
  sudo mv sops-v3.11.0.linux.arm64 /usr/local/bin/sops
  sudo chmod +x /usr/local/bin/sops
  sudo apt install -y jq
fi

# decrypt secrets
# cerate with SOPS_AGE_RECIPIENTS="$(cat ~/.ssh/id_ed25519.pub)" sops encrypt -i sec.json
# assumes ~/.ssh/id_ed25519 is there and can decrypt the file
for f in secrets/*; do
  name="$(basename "$f")"
  if ! sudo docker secret ls | grep -q "$name"; then
    sops -d "$f" | sudo docker secret create "$name" -
  fi
done

# run docker swarm
if ! sudo docker node ls; then
  sudo docker swarm init
  sudo docker stack deploy -c docker-compose.yml myhomelab
fi