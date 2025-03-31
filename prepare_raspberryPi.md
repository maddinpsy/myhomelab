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
wget https://factory.talos.dev/image/ee21ef4a5ef808a9b7484cc0dda0f25075021691c8c09a276591eedb638ea1f9/v1.9.5/metal-arm64.raw.xz
xz -d metal-arm64.raw.xz
sudo dd if=metal-arm64.raw of=/dev/sdb conv=fsync bs=4M

# bootstrap the cluster
talosctl apply-config --insecure --mode=interactive --nodes 192.168.0.63
talosctl kubeconfig
```

to upgrade use
```
talosctl -n <node IP or DNS name> upgrade --image=factory.talos.dev/installer/ee21ef4a5ef808a9b7484cc0dda0f25075021691c8c09a276591eedb638ea1f9:v1.9.2
```
