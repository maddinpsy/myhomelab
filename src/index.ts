import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import setupNetwork from "./network";
import setupStorage from "./storage";
import setupRick from "./srv_rick";

const cfg = new pulumi.Config();

const k8sProvider = new k8s.Provider("local", { kubeconfig: cfg.getSecret("kubeconfig") });

setupNetwork(k8sProvider);
setupStorage(k8sProvider);
setupRick(k8sProvider);
