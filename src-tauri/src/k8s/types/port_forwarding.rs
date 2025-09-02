use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PortForward {
    pub id: String,
    pub namespace: String,
    pub resource_name: String,
    pub resource_type: String,
    pub local_port: i32,
    pub remote_port: i32,
    pub status: String,
    pub created_at: String,
    pub url: Option<String>,
}
