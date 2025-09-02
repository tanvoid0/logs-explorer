use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "framework_detections")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub framework_id: i32,
    pub project_path: String,
    pub detection_method: String,
    pub confidence_score: f64,
    pub detected_files: Option<String>, // JSON array of detected files
    pub metadata: Option<String>, // JSON object with additional metadata
    pub created_at: Option<DateTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::framework::Entity",
        from = "Column::FrameworkId",
        to = "super::framework::Column::Id"
    )]
    Framework,
}

impl Related<super::framework::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Framework.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
