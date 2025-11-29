import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { newDatabase } from "./postgres";

function setupWeekCalender(k8sProvider?: k8s.Provider, dependsOn?: pulumi.ResourceOptions["dependsOn"]) {

    const ns = new k8s.core.v1.Namespace("photo-week-calender", { metadata: { name: "photo-week-calender" } }, { provider: k8sProvider });
    const postgresCluster = newDatabase("photo-week-calendar-db", ns, k8sProvider, dependsOn);
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
                            image: "registry.local/photo-week-calendar:0.0.4",
                            ports: [
                                { containerPort: 3000 }
                            ],
                            env: [
                                {
                                    name: "ORIGIN",
                                    value: "http://photo-week-calender-photo-week-calender-service"
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
                                }
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