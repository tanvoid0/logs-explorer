use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, DatabaseConnection, QuerySelect};
use chrono::Utc;
// Removed unused import: use uuid::Uuid;

use crate::frameworks::entities::{FrameworkEntity, FrameworkModel, FrameworkActiveModel, FrameworkColumn};

/// Repository for framework database operations
pub struct FrameworkRepository {
    conn: DatabaseConnection,
}

impl FrameworkRepository {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }

    /// Get all frameworks
    pub async fn get_all(&self) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        FrameworkEntity::find().all(&self.conn).await
    }

    /// Get active frameworks
    pub async fn get_active(&self) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        FrameworkEntity::find()
            .filter(FrameworkColumn::IsActive.eq(true))
            .all(&self.conn)
            .await
    }

    /// Get a framework by ID
    pub async fn get_by_id(&self, id: i32) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        FrameworkEntity::find()
            .filter(FrameworkColumn::Id.eq(id))
            .one(&self.conn)
            .await
    }

    /// Get a framework by name
    pub async fn get_by_name(&self, name: &str) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        FrameworkEntity::find()
            .filter(FrameworkColumn::Name.eq(name))
            .one(&self.conn)
            .await
    }

    /// Create a new framework
    pub async fn create(
        &self,
        name: String,
        category: String,
        description: Option<String>,
        version: Option<String>,
    ) -> Result<FrameworkModel, sea_orm::DbErr> {
        let framework = FrameworkActiveModel {
            id: sea_orm::ActiveValue::NotSet,
            name: sea_orm::ActiveValue::Set(name),
            category: sea_orm::ActiveValue::Set(category),
            description: sea_orm::ActiveValue::Set(description),
            version: sea_orm::ActiveValue::Set(version),
            website: sea_orm::ActiveValue::Set(None),
            documentation_url: sea_orm::ActiveValue::Set(None),
            is_active: sea_orm::ActiveValue::Set(true),
            created_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
            updated_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
        };

        framework.insert(&self.conn).await
    }

    /// Update an existing framework
    pub async fn update(
        &self,
        id: i32,
        name: String,
        category: String,
        description: Option<String>,
        version: Option<String>,
    ) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        let framework = FrameworkEntity::find()
            .filter(FrameworkColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(framework) = framework {
            let mut framework: FrameworkActiveModel = framework.into();
            framework.name = Set(name);
            framework.category = Set(category);
            framework.description = Set(description);
            framework.version = Set(version);
            framework.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(framework.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Delete a framework
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        let result = FrameworkEntity::delete_many()
            .filter(FrameworkColumn::Id.eq(id))
            .exec(&self.conn)
            .await?;
        
        Ok(result.rows_affected > 0)
    }

    /// Toggle framework active status
    pub async fn toggle_active(&self, id: i32) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        let framework = FrameworkEntity::find()
            .filter(FrameworkColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(framework) = framework {
            let current_active = framework.is_active;
            let mut framework: FrameworkActiveModel = framework.into();
            framework.is_active = Set(!current_active);
            framework.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(framework.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Get frameworks by category
    pub async fn get_by_category(&self, category: &str) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        FrameworkEntity::find()
            .filter(FrameworkColumn::Category.eq(category))
            .all(&self.conn)
            .await
    }

    /// Get unique framework categories
    pub async fn get_categories(&self) -> Result<Vec<String>, sea_orm::DbErr> {
        let frameworks = FrameworkEntity::find()
            .select_only()
            .column(FrameworkColumn::Category)
            .group_by(FrameworkColumn::Category)
            .into_tuple()
            .all(&self.conn)
            .await?;

        Ok(frameworks.into_iter().map(|(category,)| category).collect())
    }

    /// Search frameworks
    pub async fn search(&self, query: &str) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        FrameworkEntity::find()
            .filter(
                FrameworkColumn::Name.contains(query)
                    .or(FrameworkColumn::Description.contains(query))
                    .or(FrameworkColumn::Category.contains(query))
            )
            .all(&self.conn)
            .await
    }
}
