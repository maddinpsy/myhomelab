import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import setupNetwork from "./network";
import { setupStorage, StorageConfig } from "./storage";
import setupRick from "./srv_rick";
import { setupPostgres, newDatabase } from "./postgres";
import { setupMinio } from "./minio";
import { createRegistry } from "./registry";

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
newDatabase("cnpg-test", k8sProvider, postgres);

let minio = setupMinio(k8sProvider, network);

let registry = createRegistry(k8sProvider);