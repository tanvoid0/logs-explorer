use tauri::command;
use crate::k8s::services::{PodService, DeploymentService, ServiceService, LogService, NamespaceService};
use crate::k8s::services::client;

// Initialize Kubernetes client
#[command]
pub async fn init_k8s() -> Result<bool, String> {
    client::init_k8s_client()
        .await
        .map(|_| true)
        .map_err(|e| e.to_string())
}

// Health check command
#[command]
pub async fn k8s_health_check() -> Result<bool, String> {
    // Simple health check - try to get namespaces to verify connection
    let service = NamespaceService::new();
    match service.get_namespaces().await {
        Ok(_) => Ok(true),
        Err(_) => Ok(false)
    }
}

// Cluster health check command
#[command]
pub async fn check_k8s_cluster_health() -> Result<bool, String> {
    // More comprehensive cluster health check
    let service = NamespaceService::new();
    match service.get_namespaces().await {
        Ok(_) => Ok(true),
        Err(_) => Ok(false)
    }
}

// Namespace commands
#[command]
pub async fn k8s_get_namespaces() -> Result<Vec<crate::k8s::types::K8sNamespace>, String> {
    let service = NamespaceService::new();
    service.get_namespaces().await.map_err(|e| e.to_string())
}

// Pod commands

#[command]
pub async fn k8s_get_pods(namespace: String) -> Result<Vec<crate::k8s::types::K8sPod>, String> {
    let service = PodService::new();
    service.get_pods(&namespace).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_pod(namespace: String, name: String) -> Result<Option<crate::k8s::types::K8sPod>, String> {
    let service = PodService::new();
    service.get_pod(&namespace, &name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_delete_pod(namespace: String, name: String) -> Result<bool, String> {
    let service = PodService::new();
    service.delete_pod(&namespace, &name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_pod_logs(namespace: String, name: String, container: Option<String>) -> Result<String, String> {
    let service = PodService::new();
    service.get_pod_logs(&namespace, &name, container.as_deref()).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_pod_details(namespace: String, name: String) -> Result<Option<serde_json::Value>, String> {
    let service = PodService::new();
    service.get_pod_details(&namespace, &name).await.map_err(|e| e.to_string())
}

// Deployment commands

#[command]
pub async fn k8s_get_deployments(namespace: String) -> Result<Vec<crate::k8s::types::K8sDeployment>, String> {
    let service = DeploymentService::new();
    service.get_deployments(&namespace).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_deployment(namespace: String, name: String) -> Result<Option<crate::k8s::types::K8sDeployment>, String> {
    let service = DeploymentService::new();
    service.get_deployment(&namespace, &name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_scale_deployment(namespace: String, name: String, replicas: i32) -> Result<bool, String> {
    let service = DeploymentService::new();
    service.scale_deployment(&namespace, &name, replicas).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_delete_deployment(namespace: String, name: String) -> Result<bool, String> {
    let service = DeploymentService::new();
    service.delete_deployment(&namespace, &name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_deployment_details(namespace: String, name: String) -> Result<Option<serde_json::Value>, String> {
    let service = DeploymentService::new();
    service.get_deployment_details(&namespace, &name).await.map_err(|e| e.to_string())
}

// Service commands

#[command]
pub async fn k8s_get_services(namespace: String) -> Result<Vec<crate::k8s::types::K8sService>, String> {
    let service = ServiceService::new();
    service.get_services(&namespace).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_service(namespace: String, name: String) -> Result<Option<crate::k8s::types::K8sService>, String> {
    let service = ServiceService::new();
    service.get_service(&namespace, &name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_delete_service(namespace: String, name: String) -> Result<bool, String> {
    let service = ServiceService::new();
    service.delete_service(&namespace, &name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_service_details(namespace: String, name: String) -> Result<Option<serde_json::Value>, String> {
    let service = ServiceService::new();
    service.get_service_details(&namespace, &name).await.map_err(|e| e.to_string())
}

// Log commands

#[command]
pub async fn k8s_get_logs(namespace: String, pod_name: String, container: Option<String>) -> Result<Vec<crate::k8s::types::K8sLog>, String> {
    let service = LogService::new();
    service.get_pod_logs(&namespace, &pod_name, container.as_deref()).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_logs_from_pods(namespace: String, pod_names: Vec<String>) -> Result<Vec<crate::k8s::types::K8sLog>, String> {
    let service = LogService::new();
    service.get_logs_from_pods(&namespace, pod_names).await.map_err(|e| e.to_string())
}

#[command]
pub async fn k8s_get_container_logs(namespace: String, pod_name: String, container: String) -> Result<Vec<crate::k8s::types::K8sLog>, String> {
    let service = LogService::new();
    service.get_container_logs(&namespace, &pod_name, &container).await.map_err(|e| e.to_string())
}

// ConfigMap commands
#[command]
pub async fn k8s_get_config_maps(_namespace: String) -> Result<Vec<crate::k8s::types::K8sConfigMap>, String> {
    // TODO: Implement ConfigMap service
    Ok(Vec::new())
}

// Secret commands
#[command]
pub async fn k8s_get_secrets(_namespace: String) -> Result<Vec<crate::k8s::types::K8sSecret>, String> {
    // TODO: Implement Secret service
    Ok(Vec::new())
}

// Job commands
#[command]
pub async fn k8s_get_jobs(_namespace: String) -> Result<Vec<crate::k8s::types::K8sJob>, String> {
    // TODO: Implement Job service
    Ok(Vec::new())
}

#[command]
pub async fn k8s_get_job_pods(_namespace: String, _app_name: String) -> Result<Vec<crate::k8s::types::K8sJobPod>, String> {
    // TODO: Implement Job service
    Ok(Vec::new())
}
