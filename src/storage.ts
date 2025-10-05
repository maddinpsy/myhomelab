import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

/*
* Idea behind my storage solution
I have two device and don't want to buy a new one.
 - RaspberryPi4
 - Odroid HC2
Raspberry runs TalosOS creating a k8s single node cluster
Odroid runs a NAS Server, there is no TalosOS available

Most Application Data is stored on Raspberry PIs SD Card or external USB SSD.
The data is backed up to NAS Server which runs a 4TB HDD.
Big Data, like "all Pictures and Videos of all Time" are on the NAS only.
There is a second 4TB HDD that I will connect once a month to the NAS to manually backup all data to third drive.
Nothing is encrypted, for now.

In K8S there are:
- local path provisioner
- NFS subdir provisioner
- a Job that syncs the whole SSD content to the NAS once a day using restic
*/

export type StorageConfig = {
    backupPassword: pulumi.Output<string>;
    nfsServer: string;
    nfsPath: string;
}

export function setupStorage(storageConfig: StorageConfig, k8sProvider?: k8s.Provider) {

    // Local Path Provisioner
    new k8s.yaml.ConfigFile("provi",
        {
            file: "https://raw.githubusercontent.com/rancher/local-path-provisioner/refs/tags/v0.0.32/deploy/local-path-storage.yaml"
        },
        { provider: k8sProvider }
    );

    // Sync CronJob
    new k8s.batch.v1.CronJob("backup", {
        metadata: { name: "backup", namespace: "local-path-storage" },
        spec: {
            // daily at 2am
            schedule: "0 2 * * *",
            jobTemplate: {
                spec: {
                    template: {
                        spec: {
                            containers: [
                                {
                                    name: "restic",
                                    image: "restic/restic",
                                    args: [
                                        "backup", "/local"
                                    ],
                                    env: [
                                        { name: "RESTIC_REPOSITORY", value: "/nfs" },
                                        { name: "RESTIC_PASSWORD", value: storageConfig.backupPassword },
                                        { name: "RESTIC_HOST", value: "k8s-node-backup" },
                                    ],
                                    volumeMounts: [
                                        { name: "local", mountPath: "/local" },
                                        { name: "nfs", mountPath: "/nfs" },
                                    ],
                                },
                            ],
                            restartPolicy: "OnFailure",
                            volumes: [
                                { name: "local", hostPath: { path: "/opt/local-path-provisioner", type: "Directory" } },
                                { name: "nfs", nfs: { server: storageConfig.nfsServer, path: storageConfig.nfsPath } },
                            ],
                        },
                    },
                },
            },
        },
    }, { provider: k8sProvider });

}

