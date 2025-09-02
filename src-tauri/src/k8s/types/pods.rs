use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PodPort {
    pub name: Option<String>,
    pub container_port: i32,
    pub protocol: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sPod {
    pub name: String,
    pub namespace: String,
    pub status: String,
    pub ready: String,
    pub restarts: i32,
    pub age: String,
    pub ports: Option<Vec<PodPort>>,
}
