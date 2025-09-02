use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sNamespace {
    pub name: String,
    pub status: String,
    pub age: String,
}
