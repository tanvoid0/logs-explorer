use serde::{Deserialize, Serialize};
use super::pods::PodPort;

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
    pub ports: Option<Vec<PodPort>>,
}
