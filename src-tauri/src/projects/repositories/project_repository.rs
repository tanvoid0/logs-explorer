use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, DatabaseConnection, QueryOrder, QuerySelect};
use chrono::Utc;
// Removed unused import: use uuid::Uuid;

use crate::projects::entities::{ProjectEntity, ProjectModel, ProjectActiveModel, ProjectColumn};

/// Repository for project database operations
pub struct ProjectRepository {
    conn: DatabaseConnection,
}

impl ProjectRepository {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }

    /// Get all projects
    pub async fn get_all(&self) -> Result<Vec<ProjectModel>, sea_orm::DbErr> {
        ProjectEntity::find().all(&self.conn).await
    }

    /// Get a project by ID
    pub async fn get_by_id(&self, id: i32) -> Result<Option<ProjectModel>, sea_orm::DbErr> {
        ProjectEntity::find()
            .filter(ProjectColumn::Id.eq(id))
            .one(&self.conn)
            .await
    }

    /// Create a new project
    pub async fn create(
        &self,
        name: String,
        path: String,
        framework: Option<String>,
        deployment: Option<String>,
    ) -> Result<ProjectModel, sea_orm::DbErr> {
        let project = ProjectActiveModel {
            id: sea_orm::ActiveValue::NotSet,
            name: sea_orm::ActiveValue::Set(name),
            path: sea_orm::ActiveValue::Set(path),
            framework: sea_orm::ActiveValue::Set(framework),
            deployment: sea_orm::ActiveValue::Set(deployment),
            starred: sea_orm::ActiveValue::Set(false),
            created_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
            updated_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
        };

        project.insert(&self.conn).await
    }

    /// Update an existing project
    pub async fn update(
        &self,
        id: i32,
        name: String,
        path: String,
        framework: Option<String>,
        deployment: Option<String>,
    ) -> Result<Option<ProjectModel>, sea_orm::DbErr> {
        let project = ProjectEntity::find()
            .filter(ProjectColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(project) = project {
            let mut project: ProjectActiveModel = project.into();
            project.name = Set(name);
            project.path = Set(path);
            project.framework = Set(framework);
            project.deployment = Set(deployment);
            project.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(project.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Delete a project
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        let result = ProjectEntity::delete_many()
            .filter(ProjectColumn::Id.eq(id))
            .exec(&self.conn)
            .await?;
        
        Ok(result.rows_affected > 0)
    }

    /// Toggle project star status
    pub async fn toggle_star(&self, id: i32) -> Result<Option<ProjectModel>, sea_orm::DbErr> {
        let project = ProjectEntity::find()
            .filter(ProjectColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(project) = project {
            let current_starred = project.starred;
            let mut project: ProjectActiveModel = project.into();
            project.starred = Set(!current_starred);
            project.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(project.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Get projects with filters
    pub async fn get_with_filters(
        &self,
        framework_filter: Option<String>,
        sort_by: Option<String>,
        search_query: Option<String>,
    ) -> Result<Vec<ProjectModel>, sea_orm::DbErr> {
        let mut query = ProjectEntity::find();

        // Apply framework filter
        if let Some(framework) = framework_filter {
            query = query.filter(ProjectColumn::Framework.eq(framework));
        }

        // Apply search query
        if let Some(query_str) = search_query {
            query = query.filter(
                ProjectColumn::Name.contains(&query_str)
                    .or(ProjectColumn::Path.contains(&query_str))
            );
        }

        // Apply sorting
        match sort_by.as_deref() {
            Some("name") => query = query.order_by(ProjectColumn::Name, sea_orm::Order::Asc),
            Some("name_desc") => query = query.order_by(ProjectColumn::Name, sea_orm::Order::Desc),
            Some("created_at") => query = query.order_by(ProjectColumn::CreatedAt, sea_orm::Order::Desc),
            Some("updated_at") => query = query.order_by(ProjectColumn::UpdatedAt, sea_orm::Order::Desc),
            _ => query = query.order_by(ProjectColumn::Name, sea_orm::Order::Asc),
        }

        query.all(&self.conn).await
    }

    /// Get unique frameworks from projects
    pub async fn get_frameworks(&self) -> Result<Vec<String>, sea_orm::DbErr> {
        let projects = ProjectEntity::find()
            .select_only()
            .column(ProjectColumn::Framework)
            .filter(ProjectColumn::Framework.is_not_null())
            .group_by(ProjectColumn::Framework)
            .into_tuple()
            .all(&self.conn)
            .await?;

        Ok(projects.into_iter().filter_map(|(framework,)| framework).collect())
    }
}
