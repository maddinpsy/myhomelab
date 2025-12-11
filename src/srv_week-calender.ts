import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { newDatabase } from "./postgres";
import { setupMinio, createMinioBucket } from "./minio";

function setupWeekCalender(k8sProvider?: k8s.Provider, dependsOn?: pulumi.ResourceOptions["dependsOn"]) {

    const ns = new k8s.core.v1.Namespace("photo-week-calender", { metadata: { name: "photo-week-calender" } }, { provider: k8sProvider });
    const postgresCluster = newDatabase("photo-week-calendar-db", ns, k8sProvider, dependsOn);
    const minio = setupMinio("photo-week-calender-minio", ns, k8sProvider, dependsOn);
    const bucketName = "photo-week-calender-bucket";
    createMinioBucket(bucketName, minio, ns, true, k8sProvider);

    const dpl = new k8s.apps.v1.Deployment("photo-week-calender-deployment", {
        metadata: {
            namespace: ns.metadata.name,
        },
        spec: {
            selector: {
                matchLabels: {
                    "app": "photo-week-calender"
                }
            },
            template: {
                metadata: {
                    namespace: ns.metadata.name,
                    labels: {
                        "app": "photo-week-calender"
                    }
                },
                spec: {
                    containers: [
                        {
                            name: "photo-week-calender",
                            image: "registry.local/photo-week-calendar:0.2.3",
                            ports: [
                                { containerPort: 3000 }
                            ],
                            env: [
                                {
                                    name: "ORIGIN",
                                    value: "http://photo-week-calender-photo-week-calender-service"
                                },
                                {
                                    name: "BODY_SIZE_LIMIT",
                                    value: "20M"
                                },
                                {
                                    name: "DATABASE_URL",
                                    valueFrom: {
                                        secretKeyRef: {
                                            // The name of the secret is the name of the helm release plus -app
                                            name: postgresCluster.name.apply(name => `${name}-app`),
                                            key: "uri"
                                        }
                                    }
                                },
                                {
                                    name: "S3_BUCKET_NAME",
                                    value: bucketName
                                },
                                {
                                    name: "S3_ENDPOINT",
                                    value: pulumi.all([minio.name, ns.metadata.name]).apply(([minioName, nsName]) => `http://${minioName}.${nsName}.svc.cluster.local:9000`)
                                },
                                {
                                    name: "S3_ACCESS_KEY_ID",
                                    valueFrom: {
                                        secretKeyRef: {
                                            name: minio.name,
                                            key: "rootUser"
                                        }
                                    }
                                },
                                {
                                    name: "S3_SECRET_ACCESS_KEY",
                                    valueFrom: {
                                        secretKeyRef: {
                                            name: minio.name,
                                            key: "rootPassword"
                                        }
                                    }
                                },
                                {
                                    name: "S3_PUBLIC_URL_BASE",
                                    value: pulumi.all([minio.name, ns.metadata.name]).apply(([minioName, nsName]) => `http://${nsName}-${minioName}:9000/${bucketName}`)
                                    //e.g. http://photo-week-calender-photo-week-calender-minio-7482a729:9000/photo-week-calender-bucket
                                },
                                {
                                    name: "S3_FORCE_PATH_STYLE",
                                    value: "true"
                                },
                            ]
                        }
                    ]
                }
            }
        }
    }, {
        provider: k8sProvider,
        dependsOn: dependsOn
    });

    const srv = new k8s.core.v1.Service("photo-week-calender-service", {
        metadata: {
            name: "photo-week-calender-service",
            namespace: ns.metadata.name,
            annotations: {
                "tailscale.com/expose": "true"
            }
        },
        spec: {
            selector: {
                "app": "photo-week-calender"
            },
            ports: [{
                port: 80,
                targetPort: 3000
            }],
            type: "ClusterIP",
        }
    }, {
        provider: k8sProvider,
        dependsOn: dependsOn
    });

    return {
        deployment: dpl,
        service: srv
    };
}

export default setupWeekCalender;