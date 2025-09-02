use kube::{Api, ResourceExt};
use k8s_openapi::api::core::v1::Pod;
use anyhow::Result;
use serde_json::Value;
use chrono::Utc;

use crate::k8s::services::client::get_k8s_client;
use crate::k8s::types::{K8sPod, PodPort};

/// Service for handling Kubernetes pod operations
pub struct PodService;

impl PodService {
    pub fn new() -> Self {
        Self
    }

    /// Get all pods in a namespace
    pub async fn get_pods(&self, namespace: &str) -> Result<Vec<K8sPod>> {
        let client = get_k8s_client()?;
        let api: Api<Pod> = Api::namespaced(client, namespace);
        
        let pods = api.list(&Default::default()).await?;
        
        let mut k8s_pods = Vec::new();
        for pod in pods {
            let name = pod.name_any();
            let pod_namespace = pod.namespace().unwrap_or_default();
            let status = pod.status.as_ref()
                .and_then(|s| s.phase.as_ref())
                .unwrap_or(&"Unknown".to_string())
                .clone();
            
            let ready = self.get_ready_status(&pod);
            let restarts = self.get_restart_count(&pod);
            let age = self.get_age(&pod);
            let ports = self.get_pod_ports(&pod);
            
            k8s_pods.push(K8sPod {
                name,
                namespace: pod_namespace,
                status,
                ready,
                restarts,
                age,
                ports,
            });
        }
        
        Ok(k8s_pods)
    }

    /// Get a specific pod by name
    pub async fn get_pod(&self, namespace: &str, name: &str) -> Result<Option<K8sPod>> {
        let client = get_k8s_client()?;
        let api: Api<Pod> = Api::namespaced(client, namespace);
        
        match api.get(name).await {
            Ok(pod) => {
                let pod_namespace = pod.namespace().unwrap_or_default();
                let status = pod.status.as_ref()
                    .and_then(|s| s.phase.as_ref())
                    .unwrap_or(&"Unknown".to_string())
                    .clone();
                
                let ready = self.get_ready_status(&pod);
                let restarts = self.get_restart_count(&pod);
                let age = self.get_age(&pod);
                let ports = self.get_pod_ports(&pod);
                
                Ok(Some(K8sPod {
                    name: pod.name_any(),
                    namespace: pod_namespace,
                    status,
                    ready,
                    restarts,
                    age,
                    ports,
                }))
            }
            Err(_) => Ok(None),
        }
    }

    /// Delete a pod
    pub async fn delete_pod(&self, namespace: &str, name: &str) -> Result<bool> {
        let client = get_k8s_client()?;
        let api: Api<Pod> = Api::namespaced(client, namespace);
        
        match api.delete(name, &Default::default()).await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Get pod logs
    pub async fn get_pod_logs(&self, namespace: &str, name: &str, container: Option<&str>) -> Result<String> {
        let client = get_k8s_client()?;
        let api: Api<Pod> = Api::namespaced(client, namespace);
        
        let mut params = kube::api::LogParams::default();
        if let Some(container_name) = container {
            params.container = Some(container_name.to_string());
        }
        
        let logs = api.logs(name, &params).await?;
        Ok(logs)
    }

    /// Get pod details as JSON
    pub async fn get_pod_details(&self, namespace: &str, name: &str) -> Result<Option<Value>> {
        let client = get_k8s_client()?;
        let api: Api<Pod> = Api::namespaced(client, namespace);
        
        match api.get(name).await {
            Ok(pod) => {
                let pod_json = serde_json::to_value(pod)?;
                Ok(Some(pod_json))
            }
            Err(_) => Ok(None),
        }
    }

    /// Get ready status string
    fn get_ready_status(&self, pod: &Pod) -> String {
        if let Some(status) = &pod.status {
            if let Some(conditions) = &status.conditions {
                for condition in conditions {
                    if condition.type_ == "Ready" {
                        return condition.status.clone();
                    }
                }
            }
        }
        "Unknown".to_string()
    }

    /// Get restart count
    fn get_restart_count(&self, pod: &Pod) -> i32 {
        if let Some(status) = &pod.status {
            if let Some(container_statuses) = &status.container_statuses {
                return container_statuses.iter()
                    .map(|cs| cs.restart_count)
                    .sum();
            }
        }
        0
    }

    /// Get age string
    fn get_age(&self, pod: &Pod) -> String {
        let metadata = &pod.metadata;
        if let Some(creation_timestamp) = &metadata.creation_timestamp {
            // The creation_timestamp is already a DateTime, no need to parse
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

    /// Get pod ports
    fn get_pod_ports(&self, pod: &Pod) -> Option<Vec<PodPort>> {
        let mut ports = Vec::new();
        
        if let Some(spec) = &pod.spec {
            let containers = &spec.containers;
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
        
        if ports.is_empty() {
            None
        } else {
            Some(ports)
        }
    }
}
