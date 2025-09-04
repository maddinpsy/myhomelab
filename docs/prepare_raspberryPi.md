# setup of raspberry pis
download and flash TalosOS to SDCard
Details from [official Documentation](https://www.talos.dev/v1.9/talos-guides/install/single-board-computers/rpi_generic/#updating-the-eeprom)
```bash
# 1. install talosctl on workstation
# either
brew install siderolabs/tap/talosctl
# or
curl -sL https://talos.dev/install | sh

# download sepzelized raspberry image to workstation, extract and flash
wget https://factory.talos.dev/image/ee21ef4a5ef808a9b7484cc0dda0f25075021691c8c09a276591eedb638ea1f9/v1.11.0/metal-arm64.raw.xz
xz -d metal-arm64.raw.xz
sudo dd if=metal-arm64.raw of=/dev/sdb conv=fsync bs=4M

# bootstrap a single node cluster
talosctl gen config --output-types controlplane,talosconfig --config-patch '[{"op": "add", "path": "/cluster/allowSchedulingOnControlPlanes", "value": true}]' homelab https://192.168.0.63:6443
talosctl apply-config --insecure --nodes 192.168.0.63 --file controlplane.yaml
talosctl --talosconfig=./talosconfig config endpoints 192.168.0.63
talosctl bootstrap --nodes 192.168.0.63 --talosconfig=./talosconfig
# sleep 5 # wait for the cluster to start, else you get the error certificate expired
talosctl kubeconfig --talosconfig=./talosconfig --nodes 192.168.0.63
kubectl get nodes
```

to upgrade use
```
talosctl -n <node IP or DNS name> upgrade --image=factory.talos.dev/installer/ee21ef4a5ef808a9b7484cc0dda0f25075021691c8c09a276591eedb638ea1f9:v1.11.0
```

initially set up kubeconfig secret in pulumi
```
curl -fsSL https://get.pulumi.com | sh
pulumi login file://state
pulumi stack select dev
export PULUMI_CONFIG_PASSPHRASE="..."
talosctl kubeconfig --talosconfig=./talosconfig --nodes 192.168.0.63 - | pulumi config set kubeconfig --secret
```