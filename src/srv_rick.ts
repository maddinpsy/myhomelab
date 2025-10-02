import * as k8s from "@pulumi/kubernetes";

function setupRick(k8sProvider?: k8s.Provider) {

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
    }, {
        provider: k8sProvider
    });
}

export default setupRick;