use kube::{Api, ResourceExt};
use k8s_openapi::api::apps::v1::Deployment;
use anyhow::Result;
use serde_json::Value;
use chrono::Utc;

use crate::k8s::services::client::get_k8s_client;
use crate::k8s::types::{K8sDeployment, PodPort};

/// Service for handling Kubernetes deployment operations
pub struct DeploymentService;

impl DeploymentService {
    pub fn new() -> Self {
        Self
    }

    /// Get all deployments in a namespace
    pub async fn get_deployments(&self, namespace: &str) -> Result<Vec<K8sDeployment>> {
        let client = get_k8s_client()?;
        let api: Api<Deployment> = Api::namespaced(client, namespace);
        
        let deployments = api.list(&Default::default()).await?;
        
        let mut k8s_deployments = Vec::new();
        for deployment in deployments {
            let name = deployment.name_any();
            let deployment_namespace = deployment.namespace().unwrap_or_default();
            
            let (replicas, available, ready, updated) = self.get_deployment_status(&deployment);
            let status = self.get_deployment_status_string(&deployment);
            let age = self.get_age(&deployment);
            let image = self.get_deployment_image(&deployment);
            let strategy = self.get_deployment_strategy(&deployment);
            let ports = self.get_deployment_ports(&deployment);
            
            k8s_deployments.push(K8sDeployment {
                name,
                namespace: deployment_namespace,
                replicas,
                available,
                ready,
                updated,
                status,
                age,
                image,
                strategy,
                ports,
            });
        }
        
        Ok(k8s_deployments)
    }

    /// Get a specific deployment by name
    pub async fn get_deployment(&self, namespace: &str, name: &str) -> Result<Option<K8sDeployment>> {
        let client = get_k8s_client()?;
        let api: Api<Deployment> = Api::namespaced(client, namespace);
        
        match api.get(name).await {
            Ok(deployment) => {
                let deployment_namespace = deployment.namespace().unwrap_or_default();
                
                let (replicas, available, ready, updated) = self.get_deployment_status(&deployment);
                let status = self.get_deployment_status_string(&deployment);
                let age = self.get_age(&deployment);
                let image = self.get_deployment_image(&deployment);
                let strategy = self.get_deployment_strategy(&deployment);
                let ports = self.get_deployment_ports(&deployment);
                
                Ok(Some(K8sDeployment {
                    name: deployment.name_any(),
                    namespace: deployment_namespace,
                    replicas,
                    available,
                    ready,
                    updated,
                    status,
                    age,
                    image,
                    strategy,
                    ports,
                }))
            }
            Err(_) => Ok(None),
        }
    }

    /// Scale a deployment
    pub async fn scale_deployment(&self, namespace: &str, name: &str, replicas: i32) -> Result<bool> {
        let client = get_k8s_client()?;
        let api: Api<Deployment> = Api::namespaced(client, namespace);
        
        // Create a patch to update the replica count
        let patch = serde_json::json!({
            "spec": {
                "replicas": replicas
            }
        });
        
        match api.patch(name, &kube::api::PatchParams::default(), &kube::api::Patch::Merge(patch)).await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Delete a deployment
    pub async fn delete_deployment(&self, namespace: &str, name: &str) -> Result<bool> {
        let client = get_k8s_client()?;
        let api: Api<Deployment> = Api::namespaced(client, namespace);
        
        match api.delete(name, &Default::default()).await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Get deployment details as JSON
    pub async fn get_deployment_details(&self, namespace: &str, name: &str) -> Result<Option<Value>> {
        let client = get_k8s_client()?;
        let api: Api<Deployment> = Api::namespaced(client, namespace);
        
        match api.get(name).await {
            Ok(deployment) => {
                let deployment_json = serde_json::to_value(deployment)?;
                Ok(Some(deployment_json))
            }
            Err(_) => Ok(None),
        }
    }

    /// Get deployment status information
    fn get_deployment_status(&self, deployment: &Deployment) -> (i32, i32, i32, i32) {
        let spec_replicas = deployment.spec.as_ref()
            .and_then(|s| s.replicas)
            .unwrap_or(0);
        
        let status = deployment.status.as_ref();
        let available = status.and_then(|s| s.available_replicas).unwrap_or(0);
        let ready = status.and_then(|s| s.ready_replicas).unwrap_or(0);
        let updated = status.and_then(|s| s.updated_replicas).unwrap_or(0);
        
        (spec_replicas, available, ready, updated)
    }

    /// Get deployment status string
    fn get_deployment_status_string(&self, deployment: &Deployment) -> String {
        let status = deployment.status.as_ref();
        
        if let Some(status) = status {
            if let Some(conditions) = &status.conditions {
                for condition in conditions {
                    if condition.type_ == "Available" {
                        return condition.status.clone();
                    }
                }
            }
        }
        
        "Unknown".to_string()
    }

    /// Get age string
    fn get_age(&self, deployment: &Deployment) -> String {
        let metadata = &deployment.metadata;
        if let Some(creation_timestamp) = &metadata.creation_timestamp {
            let created = creation_timestamp.0;
            let now = Utc::now();
            let duration = now.signed_duration_since(created);
            
            if duration.num_days() > 0 {
                return format!("{}d", duration.num_days());
            } else if duration.num_hours() > 0 {
                return format!("{}h", duration.num_hours());
            } else if duration.num_minutes() > 0 {
                return format!("{}m", duration.num_minutes());
            } else {
                return format!("{}s", duration.num_seconds());
            }
        }
        "Unknown".to_string()
    }

    /// Get deployment image
    fn get_deployment_image(&self, deployment: &Deployment) -> String {
        if let Some(spec) = &deployment.spec {
            let template = &spec.template;
            if let Some(pod_spec) = &template.spec {
                let containers = &pod_spec.containers;
                if let Some(first_container) = containers.first() {
                    return first_container.image.as_ref().unwrap_or(&"Unknown".to_string()).clone();
                }
            }
        }
        "Unknown".to_string()
    }

    /// Get deployment strategy
    fn get_deployment_strategy(&self, deployment: &Deployment) -> String {
        if let Some(spec) = &deployment.spec {
            if let Some(strategy) = &spec.strategy {
                if let Some(strategy_type) = &strategy.type_ {
                    return strategy_type.clone();
                }
            }
        }
        "RollingUpdate".to_string()
    }

    /// Get deployment ports
    fn get_deployment_ports(&self, deployment: &Deployment) -> Option<Vec<PodPort>> {
        let mut ports = Vec::new();
        
        if let Some(spec) = &deployment.spec {
            let template = &spec.template;
            if let Some(pod_spec) = &template.spec {
                let containers = &pod_spec.containers;
                for container in containers {
                    if let Some(container_ports) = &container.ports {
                        for port in container_ports {
                            ports.push(PodPort {
                                name: port.name.clone(),
                                container_port: port.container_port,
                                protocol: port.protocol.as_ref().unwrap_or(&"TCP".to_string()).clone(),
                            });
                        }
                    }
                }
            }
        }
        
        if ports.is_empty() {
            None
        } else {
            Some(ports)
        }
    }
}
