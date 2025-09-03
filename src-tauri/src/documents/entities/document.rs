use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "documents")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub uuid: String,
    pub title: String,
    pub content: String,
    pub content_draft: Option<String>,
    pub is_draft: bool,
    pub project_id: Option<i32>,
    pub deployment_id: Option<String>,
    pub tags: Option<Value>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub last_edited_at: Option<DateTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "crate::projects::entities::project::Entity",
        from = "Column::ProjectId",
        to = "crate::projects::entities::project::Column::Id"
    )]
    Project,
}

impl Related<crate::projects::entities::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Project.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
