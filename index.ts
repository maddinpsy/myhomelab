import * as pulumi from "@pulumi/pulumi";


import * as k8s from "@pulumi/kubernetes";

const cfg = new pulumi.Config();

const k8sProvider = new k8s.Provider("local", { kubeconfig: cfg.requireSecret("kubeconfig") });
const tailscaleClientId = cfg.requireSecret("tailscaleClientId");
const tailscaleClientSecret = cfg.requireSecret("tailscaleClientSecret");

const operatorNamespace = new k8s.core.v1.Namespace("tailscaleNamespace", { metadata: { name: "tailscale" } });

const operatorOauth = new k8s.core.v1.Secret("operator-oauth-pulumi-name", {
    metadata: {
        name: "operator-oauth",
        namespace: operatorNamespace.metadata.name
    },
    stringData: {
        "client_id": tailscaleClientId,
        "client_secret": tailscaleClientSecret
    }
});

const tailscaleOperator = new k8s.helm.v3.Release("tailscale-operator", {
    chart: "tailscale-operator",
    repositoryOpts: {
        repo: "https://pkgs.tailscale.com/helmcharts"
    },
    namespace: operatorNamespace.metadata.name,
    version: "1.86.2"
}, { provider: k8sProvider });