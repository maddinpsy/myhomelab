import * as k8s from "@pulumi/kubernetes";


function setupStorage(k8sProvider?: k8s.Provider) {
    new k8s.yaml.ConfigFile("provi",
        {
            file: "https://raw.githubusercontent.com/rancher/local-path-provisioner/refs/tags/v0.0.32/deploy/local-path-storage.yaml"
        },
        { provider: k8sProvider }
    );

}

export default setupStorage;