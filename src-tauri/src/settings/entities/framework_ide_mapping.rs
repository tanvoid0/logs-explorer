use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "framework_ide_mappings")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub framework: String,
    pub ide_id: i32,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::ide_config::Entity",
        from = "Column::IdeId",
        to = "super::ide_config::Column::Id"
    )]
    IdeConfig,
}

impl Related<super::ide_config::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::IdeConfig.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
