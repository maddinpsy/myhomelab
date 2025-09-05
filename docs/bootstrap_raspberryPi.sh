#!/bin/bash
if [ -z "$1" ] 
then
   echo "missing ip address!";
   echo "Usage: $0 <ip>"
   exit
fi
# bootstrap a single node cluster
talosctl gen config --output-types controlplane,talosconfig homelab https://$1:6443
# use as default talosconfig
mv ./talosconfig ~/.talos/config
# make it single node, controlplain may sedule workload
talosctl machineconfig patch controlplane.yaml -p '[{"op": "add", "path": "/cluster/allowSchedulingOnControlPlanes", "value": true}]' -o controlplane.yaml
# fix tailscale permission 
talosctl machineconfig patch controlplane.yaml -p '[{"op": "add", "path": "/cluster/apiServer/admissionControl/0/configuration/exemptions/namespaces/1", "value": tailscale}]' -o controlplane.yaml
# fix local-path-storage permission 
talosctl machineconfig patch controlplane.yaml -p '[{"op": "add", "path": "/cluster/apiServer/admissionControl/0/configuration/exemptions/namespaces/2", "value": local-path-storage}]' -o controlplane.yaml
talosctl apply-config --insecure --nodes $1 --file controlplane.yaml
talosctl config endpoints $1
talosctl bootstrap --nodes $1
# sleep 5 # wait for the cluster to start, else you get the error certificate expired
talosctl kubeconfig --nodes $1