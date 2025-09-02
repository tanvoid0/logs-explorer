use kube::{Api, ResourceExt};
use k8s_openapi::api::core::v1::Namespace;
use anyhow::Result;
use chrono::Utc;

use crate::k8s::services::client::get_k8s_client;
use crate::k8s::types::K8sNamespace;

/// Service for handling Kubernetes namespace operations
pub struct NamespaceService;

impl NamespaceService {
    pub fn new() -> Self {
        Self
    }

    /// Get all namespaces
    pub async fn get_namespaces(&self) -> Result<Vec<K8sNamespace>> {
        let client = get_k8s_client()?;
        let api: Api<Namespace> = Api::all(client);
        
        let namespaces = api.list(&Default::default()).await?;
        
        let mut k8s_namespaces = Vec::new();
        for namespace in namespaces {
            let name = namespace.name_any();
            let status = namespace.status.as_ref()
                .and_then(|s| s.phase.as_ref())
                .unwrap_or(&"Unknown".to_string())
                .clone();
            let age = self.get_age(&namespace);
            
            k8s_namespaces.push(K8sNamespace {
                name,
                status,
                age,
            });
        }
        
        Ok(k8s_namespaces)
    }

    /// Get age of namespace
    fn get_age(&self, namespace: &Namespace) -> String {
        if let Some(creation_timestamp) = &namespace.metadata.creation_timestamp {
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
}
