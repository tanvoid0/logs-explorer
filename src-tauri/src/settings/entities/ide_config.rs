use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "ide_configs")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    pub executable: String,
    pub is_default: bool,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::framework_ide_mapping::Entity")]
    FrameworkIdeMapping,
}

impl Related<super::framework_ide_mapping::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::FrameworkIdeMapping.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
