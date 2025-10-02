# My Home Lab

## Goals of this project
- setup a home server for myself and my famaliy
- use more open source software
  - and save money by not having to subscribe to some online service 
- keep my data at home
  - provide services that should not be in the cloud: like private foto storage, finanzal calculations, ...
- learn more about kubernetes
  - I want to have a playground to try out k8s things
  - I want to be able to quickly spinup a website
  - Learn how to debug and monitor k8s, just get more practice
- services are accasable over vpn only
- configuration is done from local network
- save power, we only use it in the evening
- backup working, no data gets lost! ever!
- everything is infrastructure as Code
- set up/time to recover in under 10min

## Non Goals of this project
- High availability
- A Firewall and sophisticated networking
- Public Accessable (also not over clodflare tunnel or tailsacel funnel)
- host email server (I'm scared that I will can't receive/loose emails, because it it is not high avaible)

## verwendete hardware
Da es erstmal nur ein spiel prohjekt ist, will ich kein geld fur yusatzliche hardware ausgeben. 
DAher nuzte ich was ich sowiso rumliegen habe:
- Raspaberery Pi 4 => as k8s Single Node cluster 9woker and control plane)
- Odroid HC2 => as nas storage solution

## Network setup aka click ops
### Router Config
The HArdware is connected to my home network. 
I highly rely on the correkt ip addresses, because i don't have a dns, yet. 
The IPs of the PI and the NAS must be correktly configured in the routers ui. 
When changing or adding a Harware compontnet i also need to change/add the IPs.

### Tailscale
The easies way to reach the services from the internet is to use a tunnel provider like cloudflared, tailscale, zerotier,...
For now i will go with tailscale.
I use the Tailscale k8s operator. That requires me only to click and API key in the Tailscale UI.

## dev process
Everything is Infrastructre as Code, except the network setup.
For K8s deployment i use Pulumi with typescript.
I want to be able to push the cahnges to the cluster, to have shorted development cycle. 
Maybe I'll change that later to Flux or Agora to pull it from this git repo. 

### Secrets
all secretes are stored in pulumi.
The pulumi stack with encrypted secrets is commited to git.

### state
This project has no CI and there is only one Team member. 
So no lock system is needed.
The state is stored in local file and commited to git.

## How to install

### on my hardware with my tokens
```bash
pulumi login file://state
pulumi stack select prod
export PULUMI_CONFIG_PASSPHRASE="..."
pulumi config get kubeconfig > ~/.kube/config
pulumi config get talosconfig > ~/.talos/config
pulumi up
kubectl get nodes
talosctl version --nodes 192.168.2.37
```

### on new hardware with new tokens
Burn a fresh talos image and insert it into the pi.
Then run the bootstrap script and apply pulumi
```
git clone https://github.com/maddinpsy/myhomelab.git
cd myhomelab
mise trust
mise install
./docs/bootstrap_raspberryPi.sh 192.168.2.37
pulumi install
pulumi login file://state
pulumi stack select dev
export PULUMI_CONFIG_PASSPHRASE="..."
pulumi config set --secret tailscaleClientId
pulumi config set --secret tailscaleClientSecret
pulumi up
cat ~/.kube/config | pulumi config set --secret kubeconfig
cat  ~/.talos/config | pulumi config set --secret talosconfig
```
