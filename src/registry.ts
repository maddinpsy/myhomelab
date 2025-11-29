import * as k8s from "@pulumi/kubernetes";

export function createRegistry(k8sProvider: k8s.Provider) {

    // Namespace
    const ns = new k8s.core.v1.Namespace("registry", { metadata: {  name: "registry" } }, { provider: k8sProvider });

    // PersistentVolumeClaim
    const pvc = new k8s.core.v1.PersistentVolumeClaim("registry-storage", {
        metadata: {
            namespace: "registry",
        },
        spec: {
            accessModes: ["ReadWriteOnce"],
            storageClassName: "local-path",
            resources: {
                requests: {
                    storage: "10Gi"
                }
            }
        }
    }, { provider: k8sProvider });

    // Deployment
    const dpl = new k8s.apps.v1.Deployment("registry", {
        metadata: {
            namespace: ns.metadata.name,
        },
        spec: {
            selector: {
                matchLabels: {
                    "app": "registry"
                }
            },
            template: {
                metadata: {
                    namespace: ns.metadata.name,
                    labels: {
                        "app": "registry"
                    }
                },
                spec: {
                    hostNetwork: true,
                    containers: [
                        {
                            name: "registry",
                            image: "registry:3",
                            ports: [
                                { containerPort: 5000, 
                                  hostPort: 5000 }
                            ],
                            volumeMounts: [
                                {
                                    name: "registry-storage",
                                    mountPath: "/var/lib/registry"
                                }
                            ],
                        }
                    ],
                    volumes: [
                        {
                            name: "registry-storage",
                            persistentVolumeClaim: {
                                claimName: pvc.metadata.name
                            }
                        }
                    ]
                }
            }
        }
    }, { provider: k8sProvider });

    return {
        namespace: ns,
        pvc: pvc,
        deployment: dpl,
    }


}