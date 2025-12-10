import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export function setupMinio(name: string, namespace: k8s.core.v1.Namespace, k8sProvider?: k8s.Provider, dependsOn?: pulumi.ResourceOptions["dependsOn"]) {
    const minio = new k8s.helm.v3.Release(name, {
        chart: "minio",
        repositoryOpts: {
            repo: "https://charts.min.io/"
        },
        namespace: namespace.metadata.name,
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
            },
            service: {
                type: "ClusterIP",
                annotations: {
                    "tailscale.com/expose": "true"
                }
            }
        }
    }, { provider: k8sProvider, dependsOn: dependsOn });

    return minio;
}

export function createMinioBucket(
    bucketName: string,
    minioRelease: k8s.helm.v3.Release,
    namespace: k8s.core.v1.Namespace,
    anonymousAccess: boolean = false,
    k8sProvider?: k8s.Provider,
    dependsOn?: pulumi.ResourceOptions["dependsOn"]
) {
    // Get the MinIO service name and namespace
    const serviceName = minioRelease.name;
    const nsName = namespace.metadata.name;

    // Create a Job that uses the MinIO client to create the bucket
    const createBucketJob = new k8s.batch.v1.Job(
        `create-bucket-${bucketName}`,
        {
            metadata: {
                name: `create-bucket-${bucketName}`,
                namespace: nsName,
            },
            spec: {
                ttlSecondsAfterFinished: 60, // Clean up after 60 seconds
                template: {
                    spec: {
                        restartPolicy: "OnFailure",
                        containers: [
                            {
                                name: "mc",
                                image: "minio/mc:latest",
                                command: [
                                    "/bin/sh",
                                    "-c",
                                    pulumi.all([serviceName, nsName]).apply(([svc, ns]) => {
                                        const endpoint = `http://${svc}.${ns}.svc.cluster.local:9000`;
                                        return `
                                            mc alias set myminio ${endpoint} ${"$MINIO_ROOT_USER"} ${"$MINIO_ROOT_PASSWORD"}
                                            mc mb myminio/${bucketName}
                                            ${anonymousAccess ? `mc anonymous set download myminio/${bucketName}` : ""}
                                        `;
                                    }),
                                ],
                                env: [
                                    {
                                        name: "MINIO_ROOT_USER",
                                        valueFrom: {
                                            secretKeyRef: {
                                                name: minioRelease.name.apply(name => `${name}`),
                                                key: "rootUser",
                                            },
                                        },
                                    },
                                    {
                                        name: "MINIO_ROOT_PASSWORD",
                                        valueFrom: {
                                            secretKeyRef: {
                                                name: minioRelease.name.apply(name => `${name}`),
                                                key: "rootPassword",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        },
        {
            provider: k8sProvider,
            dependsOn: minioRelease,
        }
    );

    return createBucketJob;
}
