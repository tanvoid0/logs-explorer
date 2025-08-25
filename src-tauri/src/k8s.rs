use std::process::Command;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use kube::{Client, Api, ResourceExt};
use kube::api::{ListParams, ObjectList};
use k8s_openapi::api::core::v1::{Pod, Service, Namespace, ConfigMap, Secret};
use k8s_openapi::api::apps::v1::Deployment;
use anyhow::Result;
use base64::Engine;
use regex::Regex;

// Advanced search structures
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SearchOperator {
    AND,
    OR,
    NOT,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SearchField {
    Message,
    Pod,
    Container,
    Level,
    Timestamp,
    All,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SearchPattern {
    Contains(String),
    Equals(String),
    StartsWith(String),
    EndsWith(String),
    Regex(String),
    GreaterThan(String),
    LessThan(String),
    Between(String, String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchCondition {
    pub field: SearchField,
    pub pattern: SearchPattern,
    pub negated: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchQuery {
    pub conditions: Vec<SearchCondition>,
    pub operator: SearchOperator,
    pub group: Option<Box<SearchQuery>>,
}

// Search query parser
fn parse_search_query(query: &str) -> Result<SearchQuery, String> {
    // Simple parser for now - can be enhanced with proper parsing library
    let query = query.trim();
    
    if query.is_empty() {
        return Err("Empty search query".to_string());
    }
    
    // Check for logical operators
    if query.contains(" AND ") {
        let parts: Vec<&str> = query.split(" AND ").collect();
        let conditions = parts.iter()
            .map(|part| parse_simple_condition(part))
            .collect::<Result<Vec<_>, _>>()?;
        
        return Ok(SearchQuery {
            conditions,
            operator: SearchOperator::AND,
            group: None,
        });
    }
    
    if query.contains(" OR ") {
        let parts: Vec<&str> = query.split(" OR ").collect();
        let conditions = parts.iter()
            .map(|part| parse_simple_condition(part))
            .collect::<Result<Vec<_>, _>>()?;
        
        return Ok(SearchQuery {
            conditions,
            operator: SearchOperator::OR,
            group: None,
        });
    }
    
    // Single condition
    let condition = parse_simple_condition(query)?;
    Ok(SearchQuery {
        conditions: vec![condition],
        operator: SearchOperator::AND,
        group: None,
    })
}

fn parse_simple_condition(query: &str) -> Result<SearchCondition, String> {
    let query = query.trim();
    let mut negated = false;
    let mut field = SearchField::All;
    let mut pattern = SearchPattern::Contains(query.to_string());
    
    // Check for negation
    if query.starts_with("NOT ") {
        negated = true;
        let query = &query[4..];
        return parse_simple_condition(query).map(|mut condition| {
            condition.negated = true;
            condition
        });
    }
    
    // Check for field-specific searches
    if query.contains(":") {
        let parts: Vec<&str> = query.splitn(2, ':').collect();
        if parts.len() == 2 {
            let field_name = parts[0].trim().to_lowercase();
            let value = parts[1].trim();
            
            field = match field_name.as_str() {
                "message" | "msg" => SearchField::Message,
                "pod" => SearchField::Pod,
                "container" | "cont" => SearchField::Container,
                "level" | "severity" => SearchField::Level,
                "timestamp" | "time" => SearchField::Timestamp,
                _ => SearchField::All,
            };
            
            // Parse pattern
            pattern = parse_pattern(value);
        }
    } else {
        pattern = parse_pattern(query);
    }
    
    Ok(SearchCondition {
        field,
        pattern,
        negated,
    })
}

fn parse_pattern(value: &str) -> SearchPattern {
    let value = value.trim();
    
    // Check for regex pattern
    if value.starts_with('/') && value.ends_with('/') {
        let regex = value[1..value.len()-1].to_string();
        return SearchPattern::Regex(regex);
    }
    
    // Check for equals
    if value.starts_with('=') {
        return SearchPattern::Equals(value[1..].to_string());
    }
    
    // Check for starts with
    if value.starts_with('^') {
        return SearchPattern::StartsWith(value[1..].to_string());
    }
    
    // Check for ends with
    if value.ends_with('$') {
        return SearchPattern::EndsWith(value[..value.len()-1].to_string());
    }
    
    // Check for range
    if value.contains("..") {
        let parts: Vec<&str> = value.split("..").collect();
        if parts.len() == 2 {
            return SearchPattern::Between(parts[0].to_string(), parts[1].to_string());
        }
    }
    
    // Check for comparison operators
    if value.starts_with('>') {
        return SearchPattern::GreaterThan(value[1..].to_string());
    }
    
    if value.starts_with('<') {
        return SearchPattern::LessThan(value[1..].to_string());
    }
    
    // Default to contains
    SearchPattern::Contains(value.to_string())
}

// Evaluate search condition against a log entry
fn evaluate_condition(log: &K8sLog, condition: &SearchCondition) -> bool {
    let field_value = match condition.field {
        SearchField::Message => &log.message,
        SearchField::Pod => &log.pod,
        SearchField::Container => &log.container,
        SearchField::Level => &log.level,
        SearchField::Timestamp => &log.timestamp,
        SearchField::All => &log.message, // Default to message for "all"
    };
    
    let matches = match &condition.pattern {
        SearchPattern::Contains(pattern) => {
            field_value.to_lowercase().contains(&pattern.to_lowercase())
        },
        SearchPattern::Equals(pattern) => {
            field_value.to_lowercase() == pattern.to_lowercase()
        },
        SearchPattern::StartsWith(pattern) => {
            field_value.to_lowercase().starts_with(&pattern.to_lowercase())
        },
        SearchPattern::EndsWith(pattern) => {
            field_value.to_lowercase().ends_with(&pattern.to_lowercase())
        },
        SearchPattern::Regex(pattern) => {
            match Regex::new(pattern) {
                Ok(regex) => regex.is_match(field_value),
                Err(_) => false, // Invalid regex
            }
        },
        SearchPattern::GreaterThan(pattern) => {
            field_value > pattern
        },
        SearchPattern::LessThan(pattern) => {
            field_value < pattern
        },
        SearchPattern::Between(start, end) => {
            field_value >= start && field_value <= end
        },
    };
    
    if condition.negated {
        !matches
    } else {
        matches
    }
}

// Evaluate search query against a log entry
fn evaluate_query(log: &K8sLog, query: &SearchQuery) -> bool {
    if query.conditions.is_empty() {
        return true;
    }
    
    match query.operator {
        SearchOperator::AND => {
            query.conditions.iter().all(|condition| evaluate_condition(log, condition))
        },
        SearchOperator::OR => {
            query.conditions.iter().any(|condition| evaluate_condition(log, condition))
        },
        SearchOperator::NOT => {
            !query.conditions.iter().any(|condition| evaluate_condition(log, condition))
        },
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sPod {
    pub name: String,
    pub namespace: String,
    pub status: String,
    pub ready: String,
    pub restarts: i32,
    pub age: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sService {
    pub name: String,
    pub namespace: String,
    pub type_: String,
    pub cluster_ip: String,
    pub external_ip: String,
    pub ports: String,
    pub age: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sNamespace {
    pub name: String,
    pub status: String,
    pub age: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sDeployment {
    pub name: String,
    pub namespace: String,
    pub replicas: i32,
    pub available: i32,
    pub ready: i32,
    pub updated: i32,
    pub status: String,
    pub age: String,
    pub image: String,
    pub strategy: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sConfigMap {
    pub name: String,
    pub namespace: String,
    pub data: HashMap<String, String>,
    pub age: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sSecret {
    pub name: String,
    pub namespace: String,
    pub data: HashMap<String, String>,
    pub age: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sLog {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub pod: String,
    pub container: String,
}

// Kubernetes API client instance
static mut K8S_CLIENT: Option<Client> = None;

// Initialize Kubernetes client
pub async fn init_k8s_client() -> Result<()> {
    let client = Client::try_default().await?;
    unsafe {
        K8S_CLIENT = Some(client);
    }
    Ok(())
}

// Get Kubernetes client
fn get_k8s_client() -> Result<Client> {
    unsafe {
        K8S_CLIENT.clone().ok_or_else(|| anyhow::anyhow!("Kubernetes client not initialized"))
    }
}

// Get namespaces using Kubernetes API
#[tauri::command]
pub async fn k8s_get_namespaces() -> Result<Vec<K8sNamespace>, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    let api: Api<Namespace> = Api::all(client);
    
    let lp = ListParams::default();
    let namespaces: ObjectList<Namespace> = api.list(&lp).await
        .map_err(|e| format!("Failed to list namespaces: {}", e))?;
    
    let mut result = Vec::new();
    for ns in namespaces {
        let name = ns.name_any();
        let status = ns.status.as_ref()
            .and_then(|s| s.phase.as_ref())
            .unwrap_or(&"Unknown".to_string())
            .to_string();
        
        // Calculate age from creation timestamp
        let age = if let Some(creation_timestamp) = ns.metadata.creation_timestamp {
            let now = chrono::Utc::now();
            let created = chrono::DateTime::parse_from_rfc3339(&creation_timestamp.0.to_rfc3339())
                .unwrap_or(now.into());
            let duration = now.signed_duration_since(created);
            
            if duration.num_days() > 0 {
                format!("{}d", duration.num_days())
            } else if duration.num_hours() > 0 {
                format!("{}h", duration.num_hours())
            } else if duration.num_minutes() > 0 {
                format!("{}m", duration.num_minutes())
            } else {
                format!("{}s", duration.num_seconds())
            }
        } else {
            "Unknown".to_string()
        };
        
        result.push(K8sNamespace {
            name,
            status,
            age,
        });
    }
    
    Ok(result)
}

// Get pods using Kubernetes API with filtering
#[tauri::command]
pub async fn k8s_get_pods(namespace: Option<String>, filters: Option<Vec<String>>) -> Result<Vec<K8sPod>, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    
    let namespace = namespace.ok_or("Namespace is required")?;
    let api: Api<Pod> = Api::namespaced(client, &namespace);
    
    let mut lp = ListParams::default();
    
    // Apply filters if provided
    if let Some(filter_list) = filters {
        for filter in filter_list {
            lp = lp.labels(&filter);
        }
    }
    
    let pods: ObjectList<Pod> = api.list(&lp).await
        .map_err(|e| format!("Failed to list pods in namespace {}: {}", namespace, e))?;
    
    let mut result = Vec::new();
    for pod in pods {
        let name = pod.name_any();
        let status = pod.status.as_ref()
            .and_then(|s| s.phase.as_ref())
            .unwrap_or(&"Unknown".to_string())
            .to_string();
        
        // Calculate ready containers
        let ready_containers = pod.status.as_ref()
            .and_then(|s| s.container_statuses.as_ref())
            .map(|cs| cs.iter().filter(|c| c.ready).count())
            .unwrap_or(0);
        let total_containers = pod.status.as_ref()
            .and_then(|s| s.container_statuses.as_ref())
            .map(|cs| cs.len())
            .unwrap_or(0);
        let ready = format!("{}/{}", ready_containers, total_containers);
        
        // Calculate restarts
        let restarts = pod.status.as_ref()
            .and_then(|s| s.container_statuses.as_ref())
            .and_then(|cs| cs.first())
            .map(|c| c.restart_count)
            .unwrap_or(0) as i32;
        
        // Calculate age
        let age = if let Some(creation_timestamp) = pod.metadata.creation_timestamp {
            let now = chrono::Utc::now();
            let created = chrono::DateTime::parse_from_rfc3339(&creation_timestamp.0.to_rfc3339())
                .unwrap_or(now.into());
            let duration = now.signed_duration_since(created);
            
            if duration.num_days() > 0 {
                format!("{}d", duration.num_days())
            } else if duration.num_hours() > 0 {
                format!("{}h", duration.num_hours())
            } else if duration.num_minutes() > 0 {
                format!("{}m", duration.num_minutes())
            } else {
                format!("{}s", duration.num_seconds())
            }
        } else {
            "Unknown".to_string()
        };
        
        result.push(K8sPod {
            name,
            namespace: namespace.clone(),
            status,
            ready,
            restarts,
            age,
        });
    }
    
    Ok(result)
}

// Get services using Kubernetes API with filtering
#[tauri::command]
pub async fn k8s_get_services(namespace: Option<String>, filters: Option<Vec<String>>) -> Result<Vec<K8sService>, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    
    let namespace = namespace.ok_or("Namespace is required")?;
    let api: Api<Service> = Api::namespaced(client, &namespace);
    
    let mut lp = ListParams::default();
    
    // Apply filters if provided
    if let Some(filter_list) = filters {
        for filter in filter_list {
            lp = lp.labels(&filter);
        }
    }
    
    let services: ObjectList<Service> = api.list(&lp).await
        .map_err(|e| format!("Failed to list services in namespace {}: {}", namespace, e))?;
    
    let mut result = Vec::new();
    for svc in services {
        let name = svc.name_any();
        let type_ = svc.spec.as_ref()
            .and_then(|s| s.type_.as_ref())
            .unwrap_or(&"ClusterIP".to_string())
            .to_string();
        
        let cluster_ip = svc.spec.as_ref()
            .and_then(|s| s.cluster_ip.as_ref())
            .unwrap_or(&"None".to_string())
            .to_string();
        
        let external_ip = svc.status.as_ref()
            .and_then(|s| s.load_balancer.as_ref())
            .and_then(|lb| lb.ingress.as_ref())
            .and_then(|ingress| ingress.first())
            .and_then(|ing| ing.ip.as_ref())
            .unwrap_or(&"None".to_string())
            .to_string();
        
        // Format ports
        let ports = svc.spec.as_ref()
            .and_then(|s| s.ports.as_ref())
            .map(|p| p.iter().map(|port| {
                let target_port = port.target_port.as_ref()
                    .map(|tp| match tp {
                        k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::Int(i) => i.to_string(),
                        k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::String(s) => s.clone(),
                    })
                    .unwrap_or_else(|| port.port.to_string());
                format!("{}:{}", port.port, target_port)
            }).collect::<Vec<_>>().join(","))
            .unwrap_or_else(|| "None".to_string());
        
        // Calculate age
        let age = if let Some(creation_timestamp) = svc.metadata.creation_timestamp {
            let now = chrono::Utc::now();
            let created = chrono::DateTime::parse_from_rfc3339(&creation_timestamp.0.to_rfc3339())
                .unwrap_or(now.into());
            let duration = now.signed_duration_since(created);
            
            if duration.num_days() > 0 {
                format!("{}d", duration.num_days())
            } else if duration.num_hours() > 0 {
                format!("{}h", duration.num_hours())
            } else if duration.num_minutes() > 0 {
                format!("{}m", duration.num_minutes())
            } else {
                format!("{}s", duration.num_seconds())
            }
        } else {
            "Unknown".to_string()
        };
        
        result.push(K8sService {
            name,
            namespace: namespace.clone(),
            type_,
            cluster_ip,
            external_ip,
            ports,
            age,
        });
    }
    
    Ok(result)
}

// Get deployments using Kubernetes API
#[tauri::command]
pub async fn k8s_get_deployments(namespace: Option<String>) -> Result<Vec<K8sDeployment>, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    
    let namespace = namespace.ok_or("Namespace is required")?;
    let api: Api<Deployment> = Api::namespaced(client, &namespace);
    
    let lp = ListParams::default();
    let deployments: ObjectList<Deployment> = api.list(&lp).await
        .map_err(|e| format!("Failed to list deployments in namespace {}: {}", namespace, e))?;
    
    let mut result = Vec::new();
    for deployment in deployments {
        let name = deployment.name_any();
        
        // Get status information
        let status = deployment.status.as_ref()
            .and_then(|s| s.conditions.as_ref())
            .and_then(|c| c.iter().find(|cond| cond.type_ == "Available"))
            .map(|cond| if cond.status == "True" { "Running".to_string() } else { "Updating".to_string() })
            .unwrap_or_else(|| "Unknown".to_string());
        
        // Get replica information
        let replicas = deployment.spec.as_ref()
            .and_then(|s| s.replicas)
            .unwrap_or(0);
        
        let available = deployment.status.as_ref()
            .and_then(|s| s.available_replicas)
            .unwrap_or(0);
        
        let ready = deployment.status.as_ref()
            .and_then(|s| s.ready_replicas)
            .unwrap_or(0);
        
        let updated = deployment.status.as_ref()
            .and_then(|s| s.updated_replicas)
            .unwrap_or(0);
        
        // Get image information
        let image = deployment.spec.as_ref()
            .and_then(|s| s.template.spec.as_ref())
            .and_then(|spec| spec.containers.first())
            .and_then(|c| c.image.as_ref())
            .unwrap_or(&"Unknown".to_string())
            .to_string();
        
        // Get strategy
        let strategy = deployment.spec.as_ref()
            .and_then(|s| s.strategy.as_ref())
            .and_then(|strategy| strategy.type_.as_ref())
            .unwrap_or(&"RollingUpdate".to_string())
            .to_string();
        
        // Calculate age
        let age = if let Some(creation_timestamp) = deployment.metadata.creation_timestamp {
            let now = chrono::Utc::now();
            let created = chrono::DateTime::parse_from_rfc3339(&creation_timestamp.0.to_rfc3339())
                .unwrap_or(now.into());
            let duration = now.signed_duration_since(created);
            
            if duration.num_days() > 0 {
                format!("{}d", duration.num_days())
            } else if duration.num_hours() > 0 {
                format!("{}h", duration.num_hours())
            } else if duration.num_minutes() > 0 {
                format!("{}m", duration.num_minutes())
            } else {
                format!("{}s", duration.num_seconds())
            }
        } else {
            "Unknown".to_string()
        };
        
        result.push(K8sDeployment {
            name,
            namespace: namespace.clone(),
            replicas,
            available,
            ready,
            updated,
            status,
            age,
            image,
            strategy,
        });
    }
    
    Ok(result)
}

// Get ConfigMaps using Kubernetes API
#[tauri::command]
pub async fn k8s_get_configmaps(namespace: Option<String>) -> Result<Vec<K8sConfigMap>, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    
    let namespace = namespace.ok_or("Namespace is required")?;
    let api: Api<ConfigMap> = Api::namespaced(client, &namespace);
    
    let lp = ListParams::default();
    let configmaps: ObjectList<ConfigMap> = api.list(&lp).await
        .map_err(|e| format!("Failed to list ConfigMaps in namespace {}: {}", namespace, e))?;
    
    let mut result = Vec::new();
    for cm in configmaps {
        let name = cm.name_any();
        
        // Get data and convert BTreeMap to HashMap
        let data = cm.data.unwrap_or_default().into_iter().collect();
        
        // Calculate age
        let age = if let Some(creation_timestamp) = cm.metadata.creation_timestamp {
            let now = chrono::Utc::now();
            let created = chrono::DateTime::parse_from_rfc3339(&creation_timestamp.0.to_rfc3339())
                .unwrap_or(now.into());
            let duration = now.signed_duration_since(created);
            
            if duration.num_days() > 0 {
                format!("{}d", duration.num_days())
            } else if duration.num_hours() > 0 {
                format!("{}h", duration.num_hours())
            } else if duration.num_minutes() > 0 {
                format!("{}m", duration.num_minutes())
            } else {
                format!("{}s", duration.num_seconds())
            }
        } else {
            "Unknown".to_string()
        };
        
        result.push(K8sConfigMap {
            name,
            namespace: namespace.clone(),
            data,
            age,
        });
    }
    
    Ok(result)
}

// Get Secrets using Kubernetes API
#[tauri::command]
pub async fn k8s_get_secrets(namespace: Option<String>) -> Result<Vec<K8sSecret>, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    
    let namespace = namespace.ok_or("Namespace is required")?;
    let api: Api<Secret> = Api::namespaced(client, &namespace);
    
    let lp = ListParams::default();
    let secrets: ObjectList<Secret> = api.list(&lp).await
        .map_err(|e| format!("Failed to list Secrets in namespace {}: {}", namespace, e))?;
    
    let mut result = Vec::new();
    for secret in secrets {
        let name = secret.name_any();
        
        // Get data and decode from base64
        let mut decoded_data = HashMap::new();
        if let Some(data) = secret.data {
            for (key, value) in data {
                if let Ok(decoded) = base64::engine::general_purpose::STANDARD.decode(&value.0) {
                    if let Ok(decoded_str) = String::from_utf8(decoded) {
                        decoded_data.insert(key, decoded_str);
                    }
                }
            }
        }
        
        // Calculate age
        let age = if let Some(creation_timestamp) = secret.metadata.creation_timestamp {
            let now = chrono::Utc::now();
            let created = chrono::DateTime::parse_from_rfc3339(&creation_timestamp.0.to_rfc3339())
                .unwrap_or(now.into());
            let duration = now.signed_duration_since(created);
            
            if duration.num_days() > 0 {
                format!("{}d", duration.num_days())
            } else if duration.num_hours() > 0 {
                format!("{}h", duration.num_hours())
            } else if duration.num_minutes() > 0 {
                format!("{}m", duration.num_minutes())
            } else {
                format!("{}s", duration.num_seconds())
            }
        } else {
            "Unknown".to_string()
        };
        
        result.push(K8sSecret {
            name,
            namespace: namespace.clone(),
            data: decoded_data,
            age,
        });
    }
    
    Ok(result)
}

// Get logs from a pod using kubectl (keeping this for now as it's more complex with API)
#[tauri::command]
pub async fn k8s_get_logs(namespace: String, pod: String, container: Option<String>, tail: Option<i32>) -> Result<Vec<K8sLog>, String> {
    let result = tokio::task::spawn_blocking(move || {
        let mut cmd = Command::new("kubectl");
        cmd.arg("logs")
            .arg("-n").arg(&namespace)
            .arg(&pod);

        if let Some(ref cont) = container {
            cmd.arg("-c").arg(cont);
        }

        if let Some(t) = tail {
            cmd.arg("--tail").arg(t.to_string());
        }

        let output = cmd.output()
            .map_err(|e| format!("Failed to execute kubectl logs: {}", e))?;

        if !output.status.success() {
            return Err(format!("kubectl logs command failed: {}", String::from_utf8_lossy(&output.stderr)));
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        let mut logs = Vec::new();

        for line in output_str.lines() {
            if !line.trim().is_empty() {
                // Parse log line (this is a simplified parser)
                logs.push(K8sLog {
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    level: "INFO".to_string(),
                    message: line.to_string(),
                    pod: pod.clone(),
                    container: container.clone().unwrap_or_else(|| "main".to_string()),
                });
            }
        }

        Ok(logs)
    }).await.map_err(|e| format!("Task failed: {}", e))?;

    result
}

// Get logs from namespace with optional filtering by deployments or pods
#[tauri::command]
pub async fn k8s_get_namespace_logs(
    namespace: String, 
    deployments: Option<Vec<String>>, 
    pods: Option<Vec<String>>, 
    tail: Option<i32>,
    page: Option<i32>,
    search: Option<String>,
    severity: Option<String>,
    trace_id: Option<String>
) -> Result<Vec<K8sLog>, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    let api: Api<Pod> = Api::namespaced(client, &namespace);
    
    // Get all pods in the namespace
    let pods_list = api.list(&ListParams::default()).await
        .map_err(|e| format!("Failed to get pods in namespace {}: {}", namespace, e))?;
    
    let mut all_logs = Vec::new();
    
    for pod_obj in pods_list {
        let pod_name = pod_obj.name_any();
        
        // Filter by specific pods if provided
        if let Some(ref pod_filter) = pods {
            if !pod_filter.contains(&pod_name) {
                continue;
            }
        }
        
        // Filter by deployments if provided
        if let Some(ref deployment_filter) = deployments {
            let mut matches_deployment = false;
            
            // Check if pod belongs to any of the specified deployments
            if let Some(ref labels) = pod_obj.metadata.labels {
                if let Some(app_label) = labels.get("app") {
                    if deployment_filter.contains(app_label) {
                        matches_deployment = true;
                    }
                }
                // Also check for deployment name in labels
                if let Some(deployment_label) = labels.get("app.kubernetes.io/name") {
                    if deployment_filter.contains(deployment_label) {
                        matches_deployment = true;
                    }
                }
            }
            
            // If no deployment labels match, try to extract deployment name from pod name
            if !matches_deployment {
                // Common pattern: deployment-name-replicaset-pod-id
                let parts: Vec<&str> = pod_name.split('-').collect();
                if parts.len() >= 3 {
                    let deployment_part = parts[..parts.len()-2].join("-");
                    if deployment_filter.contains(&deployment_part) {
                        matches_deployment = true;
                    }
                }
            }
            
            if !matches_deployment {
                continue;
            }
        }
        
        // Get logs for this pod
        match k8s_get_logs(namespace.clone(), pod_name.clone(), None, tail).await {
            Ok(mut pod_logs) => {
                all_logs.append(&mut pod_logs);
            }
            Err(e) => {
                // Log error but continue with other pods
                println!("Failed to get logs for pod {}: {}", pod_name, e);
            }
        }
    }
    
    // Sort logs by timestamp
    all_logs.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));
    
    // Apply advanced text search if provided
    if let Some(ref search_query) = search {
        if !search_query.trim().is_empty() {
            match parse_search_query(search_query) {
                Ok(query) => {
                    all_logs.retain(|log| evaluate_query(log, &query));
                },
                Err(e) => {
                    // Fallback to simple search if parsing fails
                    let search_lower = search_query.to_lowercase();
                    all_logs.retain(|log| {
                        log.message.to_lowercase().contains(&search_lower) ||
                        log.pod.to_lowercase().contains(&search_lower) ||
                        log.container.to_lowercase().contains(&search_lower) ||
                        log.level.to_lowercase().contains(&search_lower)
                    });
                }
            }
        }
    }
    
    // Apply severity filter if provided
    if let Some(ref severity_filter) = severity {
        if !severity_filter.trim().is_empty() {
            let severity_lower = severity_filter.to_lowercase();
            all_logs.retain(|log| {
                log.level.to_lowercase() == severity_lower
            });
        }
    }
    
    // Apply trace ID filter if provided
    if let Some(ref trace_id_filter) = trace_id {
        if !trace_id_filter.trim().is_empty() {
            let trace_id_lower = trace_id_filter.to_lowercase();
            all_logs.retain(|log| {
                log.message.to_lowercase().contains(&trace_id_lower)
            });
        }
    }
    
    // Apply pagination if page is specified
    if let Some(page_num) = page {
        let page_size = tail.unwrap_or(50) as usize;
        let start_index = (page_num - 1) as usize * page_size;
        let end_index = std::cmp::min(start_index + page_size, all_logs.len());
        
        if start_index < all_logs.len() {
            all_logs = all_logs[start_index..end_index].to_vec();
        } else {
            all_logs.clear();
        }
    }
    
    Ok(all_logs)
}

// Get containers for a specific pod
#[tauri::command]
pub async fn k8s_get_pod_containers(namespace: String, pod: String) -> Result<Vec<String>, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    let api: Api<Pod> = Api::namespaced(client, &namespace);
    
    let pod_obj = api.get(&pod).await
        .map_err(|e| format!("Failed to get pod {}: {}", pod, e))?;
    
    let mut containers = Vec::new();
    
    // Get containers from spec
    if let Some(ref spec) = pod_obj.spec {
        for container in &spec.containers {
            containers.push(container.name.clone());
        }
        
        // Get init containers if any
        if let Some(ref init_containers) = spec.init_containers {
            for container in init_containers {
                containers.push(container.name.clone());
            }
        }
    }
    
    Ok(containers)
}

// Delete a pod (this will trigger a restart if managed by a deployment)
#[tauri::command]
pub async fn k8s_delete_pod(namespace: String, pod: String) -> Result<(), String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    let api: Api<Pod> = Api::namespaced(client, &namespace);
    
    // Delete the pod
    api.delete(&pod, &kube::api::DeleteParams::default()).await
        .map_err(|e| format!("Failed to delete pod {}: {}", pod, e))?;
    
    Ok(())
}

// Restart a pod by deleting it (deployment will recreate it)
#[tauri::command]
pub async fn k8s_restart_pod(namespace: String, pod: String) -> Result<(), String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    let api: Api<Pod> = Api::namespaced(client, &namespace);
    
    // Delete the pod to trigger a restart
    api.delete(&pod, &kube::api::DeleteParams::default()).await
        .map_err(|e| format!("Failed to restart pod {}: {}", pod, e))?;
    
    Ok(())
}

// Scale a deployment
#[tauri::command]
pub async fn k8s_scale_deployment(namespace: String, deployment: String, replicas: i32) -> Result<(), String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    let api: Api<Deployment> = Api::namespaced(client, &namespace);
    
    // Get the current deployment
    let mut deployment_obj = api.get(&deployment).await
        .map_err(|e| format!("Failed to get deployment {}: {}", deployment, e))?;
    
    // Update the replica count
    if let Some(spec) = deployment_obj.spec.as_mut() {
        spec.replicas = Some(replicas);
    }
    
    // Apply the update
    api.replace(&deployment, &kube::api::PostParams::default(), &deployment_obj).await
        .map_err(|e| format!("Failed to scale deployment {}: {}", deployment, e))?;
    
    Ok(())
}

// Health check for Kubernetes connection
#[tauri::command]
pub async fn k8s_health_check() -> Result<bool, String> {
    let client = get_k8s_client().map_err(|e| e.to_string())?;
    
    // Try to list namespaces as a health check
    let api: Api<Namespace> = Api::all(client);
    let lp = ListParams::default().limit(1); // Just get one namespace to test connection
    
    match api.list(&lp).await {
        Ok(_) => Ok(true),
        Err(_) => {
            Ok(false)
        }
    }
}

// Initialize Kubernetes client on startup
#[tauri::command]
pub async fn init_k8s() -> Result<(), String> {
    init_k8s_client().await.map_err(|e| e.to_string())
}
