import * as k8s from "@pulumi/kubernetes";

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
}

export function newDatabase(namespace: string, k8sProvider?: k8s.Provider) {
    const cluster = new k8s.helm.v3.Release("cluster", {
        chart: "cluster",
        repositoryOpts: {
            repo: "https://cloudnative-pg.github.io/charts/"
        },
        namespace: namespace,
        createNamespace: true,
        version: "0.3.1",
        values: {
            cluster: {
                instances: 1,
                storage: {
                    storageClass: "local-path"
                }
            },
        }
    }, { provider: k8sProvider });
}
