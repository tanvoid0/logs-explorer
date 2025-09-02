use kube::{Api, ResourceExt};
use k8s_openapi::api::core::v1::Service;
use anyhow::Result;
use serde_json::Value;
use chrono::Utc;

use crate::k8s::services::client::get_k8s_client;
use crate::k8s::types::K8sService;

/// Service for handling Kubernetes service operations
pub struct ServiceService;

impl ServiceService {
    pub fn new() -> Self {
        Self
    }

    /// Get all services in a namespace
    pub async fn get_services(&self, namespace: &str) -> Result<Vec<K8sService>> {
        let client = get_k8s_client()?;
        let api: Api<Service> = Api::namespaced(client, namespace);
        
        let services = api.list(&Default::default()).await?;
        
        let mut k8s_services = Vec::new();
        for service in services {
            let name = service.name_any();
            let service_namespace = service.namespace().unwrap_or_default();
            let type_ = self.get_service_type(&service);
            let cluster_ip = self.get_cluster_ip(&service);
            let external_ip = self.get_external_ip(&service);
            let ports = self.get_service_ports(&service);
            let age = self.get_age(&service);
            
            k8s_services.push(K8sService {
                name,
                namespace: service_namespace,
                type_,
                cluster_ip,
                external_ip,
                ports,
                age,
            });
        }
        
        Ok(k8s_services)
    }

    /// Get a specific service by name
    pub async fn get_service(&self, namespace: &str, name: &str) -> Result<Option<K8sService>> {
        let client = get_k8s_client()?;
        let api: Api<Service> = Api::namespaced(client, namespace);
        
        match api.get(name).await {
            Ok(service) => {
                let service_namespace = service.namespace().unwrap_or_default();
                let type_ = self.get_service_type(&service);
                let cluster_ip = self.get_cluster_ip(&service);
                let external_ip = self.get_external_ip(&service);
                let ports = self.get_service_ports(&service);
                let age = self.get_age(&service);
                
                Ok(Some(K8sService {
                    name: service.name_any(),
                    namespace: service_namespace,
                    type_,
                    cluster_ip,
                    external_ip,
                    ports,
                    age,
                }))
            }
            Err(_) => Ok(None),
        }
    }

    /// Delete a service
    pub async fn delete_service(&self, namespace: &str, name: &str) -> Result<bool> {
        let client = get_k8s_client()?;
        let api: Api<Service> = Api::namespaced(client, namespace);
        
        match api.delete(name, &Default::default()).await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Get service details as JSON
    pub async fn get_service_details(&self, namespace: &str, name: &str) -> Result<Option<Value>> {
        let client = get_k8s_client()?;
        let api: Api<Service> = Api::namespaced(client, namespace);
        
        match api.get(name).await {
            Ok(service) => {
                let service_json = serde_json::to_value(service)?;
                Ok(Some(service_json))
            }
            Err(_) => Ok(None),
        }
    }

    /// Get service type
    fn get_service_type(&self, service: &Service) -> String {
        if let Some(spec) = &service.spec {
            if let Some(service_type) = &spec.type_ {
                return service_type.clone();
            }
        }
        "ClusterIP".to_string()
    }

    /// Get cluster IP
    fn get_cluster_ip(&self, service: &Service) -> String {
        if let Some(spec) = &service.spec {
            if let Some(cluster_ip) = &spec.cluster_ip {
                return cluster_ip.clone();
            }
        }
        "None".to_string()
    }

    /// Get external IP
    fn get_external_ip(&self, service: &Service) -> String {
        if let Some(spec) = &service.spec {
            if let Some(external_ips) = &spec.external_ips {
                if !external_ips.is_empty() {
                    return external_ips.join(",");
                }
            }
        }
        "None".to_string()
    }

    /// Get service ports
    fn get_service_ports(&self, service: &Service) -> String {
        if let Some(spec) = &service.spec {
            if let Some(ports) = &spec.ports {
                let port_strings: Vec<String> = ports.iter()
                    .map(|port| {
                        if let Some(target_port) = &port.target_port {
                            match target_port {
                                k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::Int(i) => {
                                    format!("{}/{}", port.port, i)
                                }
                                k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::String(s) => {
                                    format!("{}/{}", port.port, s)
                                }
                            }
                        } else {
                            format!("{}/{}", port.port, port.port)
                        }
                    })
                    .collect();
                return port_strings.join(",");
            }
        }
        "None".to_string()
    }

    /// Get age string
    fn get_age(&self, service: &Service) -> String {
        let metadata = &service.metadata;
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
}
