use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "frameworks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    pub category: String,
    pub description: Option<String>,
    pub version: Option<String>,
    pub website: Option<String>,
    pub documentation_url: Option<String>,
    pub is_active: bool,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    // Frameworks can be linked to framework detections
    #[sea_orm(has_many = "super::framework_detection::Entity")]
    FrameworkDetection,
}

impl Related<super::framework_detection::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::FrameworkDetection.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
