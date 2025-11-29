import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export function setupPostgres(k8sProvider?: k8s.Provider) {
    const cnpg = new k8s.helm.v3.Release("cnpg", {
        chart: "cloudnative-pg",
        repositoryOpts: {
            repo: "https://cloudnative-pg.github.io/charts/"
        },
        namespace: "cnpg-system",
        createNamespace: true,
        version: "0.26.0"
    }, { provider: k8sProvider });
    return cnpg;
}

export function newDatabase(name: string, namespace: k8s.core.v1.Namespace, k8sProvider?: k8s.Provider, dependsOn?: pulumi.ResourceOptions["dependsOn"]) {
    const cluster = new k8s.helm.v3.Release(`${name}-cluster`, {
        chart: "cluster",
        repositoryOpts: {
            repo: "https://cloudnative-pg.github.io/charts/"
        },
        namespace: namespace.metadata.name,
        createNamespace: false,
        version: "0.3.1",
        values: {
            cluster: {
                instances: 1,
                storage: {
                    storageClass: "local-path"
                }
            },
        }
    }, { provider: k8sProvider, dependsOn: dependsOn });
    return cluster;
}
