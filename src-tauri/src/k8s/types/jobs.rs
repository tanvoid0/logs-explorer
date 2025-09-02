use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use super::pods::PodPort;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sJob {
    pub name: String,
    pub namespace: String,
    pub completions: i32,
    pub successful: i32,
    pub failed: i32,
    pub status: String,
    pub age: String,
    pub parent_job: Option<String>,
    pub labels: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sJobPod {
    pub name: String,
    pub namespace: String,
    pub status: String,
    pub ready: String,
    pub restarts: i32,
    pub age: String,
    pub job_name: String,
    pub ports: Option<Vec<PodPort>>,
}
