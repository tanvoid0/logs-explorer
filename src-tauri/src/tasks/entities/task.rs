use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "tasks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub uuid: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<DateTime>,
    pub parent_id: Option<String>,
    pub group_id: Option<String>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::task_group::Entity",
        from = "Column::GroupId",
        to = "super::task_group::Column::Uuid"
    )]
    TaskGroup,
    #[sea_orm(
        belongs_to = "Entity",
        from = "Column::ParentId",
        to = "Column::Uuid"
    )]
    SelfReferencing,
}

impl Related<super::task_group::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TaskGroup.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
