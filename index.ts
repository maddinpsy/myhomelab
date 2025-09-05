import * as pulumi from "@pulumi/pulumi";


import * as k8s from "@pulumi/kubernetes";

const cfg = new pulumi.Config();

const k8sProvider = new k8s.Provider("local", { kubeconfig: cfg.getSecret("kubeconfig") });

// Tailscale Operator
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

// Dummy Service
const dpl = new k8s.apps.v1.Deployment("rick-deployment", {
    spec: {
        selector: {
            matchLabels: {
                "app": "rick"
            }
        },
        template: {
            metadata: {
                labels: {
                    "app": "rick"
                }
            },
            spec: {
                containers: [
                    {
                        name: "rick",
                        image: "basstapper/rick-morty-api",
                        ports: [
                            { containerPort: 5000 }
                        ]
                    }
                ]
            }
        }
    }
}, {
    provider: k8sProvider
});

const srv = new k8s.core.v1.Service("rick-service", {
    metadata: {
        name: "rick-service",
        annotations: {
            "tailscale.com/expose": "true"
        }
    },
    spec: {
        selector: {
            "app": "rick"
        },
        ports: [{
            port: 80,
            targetPort: 5000
        }],
        type: "ClusterIP"
    }
},{dependsOn: tailscaleOperator})

new k8s.yaml.ConfigFile("provi", { file: "https://raw.githubusercontent.com/rancher/local-path-provisioner/refs/tags/v0.0.32/deploy/local-path-storage.yaml" });