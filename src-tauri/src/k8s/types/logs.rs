use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sLog {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub pod: String,
    pub container: String,
}
