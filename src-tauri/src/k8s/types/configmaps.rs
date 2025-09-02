use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct K8sConfigMap {
    pub name: String,
    pub namespace: String,
    pub data: HashMap<String, String>,
    pub age: String,
}
