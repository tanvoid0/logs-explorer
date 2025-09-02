use kube::Api;
use k8s_openapi::api::core::v1::Pod;
use anyhow::Result;

use crate::k8s::services::client::get_k8s_client;
use crate::k8s::types::K8sLog;

/// Service for handling Kubernetes log operations
pub struct LogService;

impl LogService {
    pub fn new() -> Self {
        Self
    }

    /// Get logs from a pod
    pub async fn get_pod_logs(&self, namespace: &str, pod_name: &str, container: Option<&str>) -> Result<Vec<K8sLog>> {
        let client = get_k8s_client()?;
        let api: Api<Pod> = Api::namespaced(client, namespace);
        
        let mut params = kube::api::LogParams::default();
        if let Some(container_name) = container {
            params.container = Some(container_name.to_string());
        }
        
        let logs = api.logs(pod_name, &params).await?;
        
        // Parse logs into structured format
        let mut k8s_logs = Vec::new();
        for line in logs.lines() {
            if !line.trim().is_empty() {
                k8s_logs.push(K8sLog {
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    level: "INFO".to_string(),
                    message: line.to_string(),
                    pod: pod_name.to_string(),
                    container: container.unwrap_or("main").to_string(),
                });
            }
        }
        
        Ok(k8s_logs)
    }

    /// Get logs from multiple pods
    pub async fn get_logs_from_pods(&self, namespace: &str, pod_names: Vec<String>) -> Result<Vec<K8sLog>> {
        let mut all_logs = Vec::new();
        
        for pod_name in pod_names {
            match self.get_pod_logs(namespace, &pod_name, None).await {
                Ok(logs) => all_logs.extend(logs),
                Err(_) => continue, // Skip pods that fail to get logs
            }
        }
        
        Ok(all_logs)
    }

    /// Get logs with specific container
    pub async fn get_container_logs(&self, namespace: &str, pod_name: &str, container: &str) -> Result<Vec<K8sLog>> {
        self.get_pod_logs(namespace, pod_name, Some(container)).await
    }
}
