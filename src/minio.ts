import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export function setupMinio(k8sProvider?: k8s.Provider, dependsOn?: pulumi.ResourceOptions["dependsOn"]) {
    const minio = new k8s.helm.v3.Release("minio-community", {
        chart: "minio",
        repositoryOpts: {
            repo: "https://charts.min.io/"
        },
        namespace: "minio",
        createNamespace: true,
        version: "5.4.0",
        values: {
            mode: "standalone",
            replicas: 1,
            persistence: {
                storageClass: "local-path",
                size: "10Gi"
            },
            resources: {
                requests: {
                    memory: "1Gi"
                }
            }
        }
    }, { provider: k8sProvider, dependsOn: dependsOn });

    return minio;
}
