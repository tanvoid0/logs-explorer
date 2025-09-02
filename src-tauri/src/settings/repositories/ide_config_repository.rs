use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, DatabaseConnection, prelude::Expr};
use chrono::Utc;
// Removed unused import: use uuid::Uuid;

use crate::settings::entities::{IDESettingsEntity, IDESettingsModel, IDESettingsActiveModel, IDESettingsColumn};

/// Repository for IDE settings database operations
pub struct IDESettingsRepository {
    conn: DatabaseConnection,
}

impl IDESettingsRepository {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }

    /// Get all IDE settings
    pub async fn get_all(&self) -> Result<Vec<IDESettingsModel>, sea_orm::DbErr> {
        IDESettingsEntity::find().all(&self.conn).await
    }

    /// Get default IDE settings
    pub async fn get_default(&self) -> Result<Option<IDESettingsModel>, sea_orm::DbErr> {
        IDESettingsEntity::find()
            .filter(IDESettingsColumn::IsDefault.eq(true))
            .one(&self.conn)
            .await
    }

    /// Create a new IDE settings
    pub async fn create(
        &self,
        name: String,
        executable: String,
    ) -> Result<IDESettingsModel, sea_orm::DbErr> {
        let ide_settings = IDESettingsActiveModel {
            id: sea_orm::ActiveValue::NotSet,
            name: sea_orm::ActiveValue::Set(name),
            executable: sea_orm::ActiveValue::Set(executable),
            is_default: sea_orm::ActiveValue::Set(false),
            created_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
            updated_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
        };

        ide_settings.insert(&self.conn).await
    }

    /// Update an existing IDE settings
    pub async fn update(
        &self,
        id: i32,
        name: String,
        executable: String,
    ) -> Result<Option<IDESettingsModel>, sea_orm::DbErr> {
        let ide_settings = IDESettingsEntity::find()
            .filter(IDESettingsColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(ide_settings) = ide_settings {
            let mut ide_settings: IDESettingsActiveModel = ide_settings.into();
            ide_settings.name = Set(name);
            ide_settings.executable = Set(executable);
            ide_settings.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(ide_settings.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Delete an IDE settings
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        let result = IDESettingsEntity::delete_many()
            .filter(IDESettingsColumn::Id.eq(id))
            .exec(&self.conn)
            .await?;
        
        Ok(result.rows_affected > 0)
    }

    /// Set default IDE settings
    pub async fn set_default(&self, id: i32) -> Result<Option<IDESettingsModel>, sea_orm::DbErr> {
        // First, unset all existing defaults
        let _ = IDESettingsEntity::update_many()
            .col_expr(IDESettingsColumn::IsDefault, Expr::value(false))
            .exec(&self.conn)
            .await?;

        // Then set the new default
        let ide_settings = IDESettingsEntity::find()
            .filter(IDESettingsColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(ide_settings) = ide_settings {
            let mut ide_settings: IDESettingsActiveModel = ide_settings.into();
            ide_settings.is_default = Set(true);
            ide_settings.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(ide_settings.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }
}
