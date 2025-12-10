import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import setupNetwork from "./network";
import { setupStorage, StorageConfig } from "./storage";
import { setupPostgres } from "./postgres";
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

let postgres = setupPostgres(k8sProvider);

let registry = createRegistry(k8sProvider);

setupWeekCalender(k8sProvider, [network, registry.deployment, postgres]);