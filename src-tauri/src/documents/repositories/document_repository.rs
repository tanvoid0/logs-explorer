use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, DatabaseConnection, QueryOrder};
use chrono::Utc;
use uuid::Uuid;

use crate::documents::entities::{DocumentEntity, DocumentModel, DocumentActiveModel, DocumentColumn};

/// Repository for document database operations
pub struct DocumentRepository {
    conn: DatabaseConnection,
}

impl DocumentRepository {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }

    /// Get all documents
    pub async fn get_all(&self) -> Result<Vec<DocumentModel>, sea_orm::DbErr> {
        DocumentEntity::find()
            .order_by_desc(DocumentColumn::UpdatedAt)
            .all(&self.conn)
            .await
    }

    /// Get a document by ID
    pub async fn get_by_id(&self, id: i32) -> Result<Option<DocumentModel>, sea_orm::DbErr> {
        DocumentEntity::find()
            .filter(DocumentColumn::Id.eq(id))
            .one(&self.conn)
            .await
    }

    /// Get a document by UUID
    pub async fn get_by_uuid(&self, uuid: &str) -> Result<Option<DocumentModel>, sea_orm::DbErr> {
        DocumentEntity::find()
            .filter(DocumentColumn::Uuid.eq(uuid))
            .one(&self.conn)
            .await
    }

    /// Get documents by project ID
    pub async fn get_by_project(&self, project_id: i32) -> Result<Vec<DocumentModel>, sea_orm::DbErr> {
        DocumentEntity::find()
            .filter(DocumentColumn::ProjectId.eq(project_id))
            .order_by_desc(DocumentColumn::UpdatedAt)
            .all(&self.conn)
            .await
    }

    /// Get documents by deployment ID
    pub async fn get_by_deployment(&self, deployment_id: &str) -> Result<Vec<DocumentModel>, sea_orm::DbErr> {
        DocumentEntity::find()
            .filter(DocumentColumn::DeploymentId.eq(deployment_id))
            .order_by_desc(DocumentColumn::UpdatedAt)
            .all(&self.conn)
            .await
    }

    /// Create a new document
    pub async fn create(
        &self,
        title: String,
        content: String,
        project_id: Option<i32>,
        deployment_id: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Result<DocumentModel, sea_orm::DbErr> {
        let uuid = Uuid::new_v4().to_string();
        let now = Utc::now().naive_utc();
        
        let document = DocumentActiveModel {
            id: sea_orm::ActiveValue::NotSet,
            uuid: sea_orm::ActiveValue::Set(uuid),
            title: sea_orm::ActiveValue::Set(title),
            content: sea_orm::ActiveValue::Set(content),
            content_draft: sea_orm::ActiveValue::Set(None),
            is_draft: sea_orm::ActiveValue::Set(false),
            project_id: sea_orm::ActiveValue::Set(project_id),
            deployment_id: sea_orm::ActiveValue::Set(deployment_id),
            tags: sea_orm::ActiveValue::Set(tags.map(|t| serde_json::to_value(t).unwrap())),
            created_at: sea_orm::ActiveValue::Set(Some(now)),
            updated_at: sea_orm::ActiveValue::Set(Some(now)),
            last_edited_at: sea_orm::ActiveValue::Set(Some(now)),
        };

        document.insert(&self.conn).await
    }

    /// Update document content (save draft)
    pub async fn update_draft(
        &self,
        id: i32,
        content_draft: String,
    ) -> Result<Option<DocumentModel>, sea_orm::DbErr> {
        let document = DocumentEntity::find()
            .filter(DocumentColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(document) = document {
            let mut document: DocumentActiveModel = document.into();
            document.content_draft = Set(Some(content_draft));
            document.is_draft = Set(true);
            document.last_edited_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(document.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Save document (commit draft to content)
    pub async fn save_document(
        &self,
        id: i32,
        title: Option<String>,
        content: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Result<Option<DocumentModel>, sea_orm::DbErr> {
        let document = DocumentEntity::find()
            .filter(DocumentColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(document) = document {
            let mut document: DocumentActiveModel = document.into();
            
            if let Some(title) = title {
                document.title = Set(title);
            }
            if let Some(content) = content {
                document.content = Set(content);
                document.content_draft = Set(None);
                document.is_draft = Set(false);
            }
            if let Some(tags) = tags {
                document.tags = Set(Some(serde_json::to_value(tags).unwrap()));
            }
            
            document.updated_at = Set(Some(Utc::now().naive_utc()));
            document.last_edited_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(document.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Update document metadata
    pub async fn update_metadata(
        &self,
        id: i32,
        title: Option<String>,
        project_id: Option<i32>,
        deployment_id: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Result<Option<DocumentModel>, sea_orm::DbErr> {
        let document = DocumentEntity::find()
            .filter(DocumentColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(document) = document {
            let mut document: DocumentActiveModel = document.into();
            
            if let Some(title) = title {
                document.title = Set(title);
            }
            if let Some(project_id) = project_id {
                document.project_id = Set(Some(project_id));
            }
            if let Some(deployment_id) = deployment_id {
                document.deployment_id = Set(Some(deployment_id));
            }
            if let Some(tags) = tags {
                document.tags = Set(Some(serde_json::to_value(tags).unwrap()));
            }
            
            document.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(document.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Delete a document
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        let result = DocumentEntity::delete_many()
            .filter(DocumentColumn::Id.eq(id))
            .exec(&self.conn)
            .await?;
        
        Ok(result.rows_affected > 0)
    }

    /// Search documents
    pub async fn search(
        &self,
        query: &str,
        project_id: Option<i32>,
        tags: Option<Vec<String>>,
    ) -> Result<Vec<DocumentModel>, sea_orm::DbErr> {
        let mut documents = DocumentEntity::find().all(&self.conn).await?;

        // Apply search query
        if !query.is_empty() {
            let query_lower = query.to_lowercase();
            documents = documents.into_iter()
                .filter(|d| {
                    d.title.to_lowercase().contains(&query_lower) ||
                    d.content.to_lowercase().contains(&query_lower)
                })
                .collect();
        }

        // Apply project filter
        if let Some(project_id) = project_id {
            documents = documents.into_iter()
                .filter(|d| d.project_id == Some(project_id))
                .collect();
        }

        // Apply tags filter
        if let Some(tags) = tags {
            documents = documents.into_iter()
                .filter(|d| {
                    if let Some(doc_tags) = &d.tags {
                        if let Ok(doc_tags_vec) = serde_json::from_value::<Vec<String>>(doc_tags.clone()) {
                            tags.iter().any(|tag| doc_tags_vec.contains(tag))
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                })
                .collect();
        }

        // Sort by last edited
        documents.sort_by(|a, b| {
            b.last_edited_at.unwrap_or_default().cmp(&a.last_edited_at.unwrap_or_default())
        });

        Ok(documents)
    }

    /// Get document statistics
    pub async fn get_stats(&self) -> Result<DocumentStats, sea_orm::DbErr> {
        let all_documents = DocumentEntity::find().all(&self.conn).await?;
        
        let total = all_documents.len();
        let drafts = all_documents.iter().filter(|d| d.is_draft).count();
        let linked_to_projects = all_documents.iter().filter(|d| d.project_id.is_some()).count();
        let linked_to_deployments = all_documents.iter().filter(|d| d.deployment_id.is_some()).count();
        
        Ok(DocumentStats {
            total,
            drafts,
            linked_to_projects,
            linked_to_deployments,
        })
    }
}

#[derive(Debug, Clone)]
pub struct DocumentStats {
    pub total: usize,
    pub drafts: usize,
    pub linked_to_projects: usize,
    pub linked_to_deployments: usize,
}
