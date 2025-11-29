import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import setupNetwork from "./network";
import { setupStorage, StorageConfig } from "./storage";
import setupRick from "./srv_rick";
import { setupPostgres, newDatabase } from "./postgres";
import { setupMinio } from "./minio";
import { createRegistry } from "./registry";
import setupWeekCalender from "./srv_week-calender";

const cfg = new pulumi.Config();

const k8sProvider = new k8s.Provider("local", { kubeconfig: cfg.getSecret("kubeconfig") });


const storageConfig: StorageConfig = {
    backupPassword: cfg.requireSecret("backupPassword"),
    nfsServer: cfg.require("nfsServer"),
    nfsPath: cfg.require("nfsPath"),
}
setupStorage(storageConfig, k8sProvider);

let network = setupNetwork(k8sProvider);

setupRick(k8sProvider, network);

let postgres = setupPostgres(k8sProvider);
let ns = new k8s.core.v1.Namespace("cnpg-test", { metadata: { name: "cnpg-test" } }, { provider: k8sProvider });
newDatabase("cnpg-test", ns, k8sProvider, postgres);

let minio = setupMinio(k8sProvider, network);

let registry = createRegistry(k8sProvider);

let weekCalender = setupWeekCalender(k8sProvider, [network, registry.deployment, postgres]);