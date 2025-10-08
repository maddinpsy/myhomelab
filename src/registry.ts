import * as k8s from "@pulumi/kubernetes";

export function createRegistry(k8sProvider: k8s.Provider) {

    // PersistentVolumeClaim
    const pvc = new k8s.core.v1.PersistentVolumeClaim("registry-storage", {
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
        spec: {
            selector: {
                matchLabels: {
                    "app": "registry"
                }
            },
            template: {
                metadata: {
                    labels: {
                        "app": "registry"
                    }
                },
                spec: {
                    containers: [
                        {
                            name: "registry",
                            image: "registry:3",
                            ports: [
                                { containerPort: 5000 }
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

    // Service
    const srv = new k8s.core.v1.Service("registry", {
        spec: {
            selector: {
                "app": "registry"
            },
            ports: [
                { port: 5000, targetPort: 5000 }
            ],
            type: "ClusterIP"
        }
    }, { provider: k8sProvider });

    return {
        deployment: dpl,
        pvc: pvc,
        service: srv
    }


}