use serde::{Deserialize, Serialize};

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
