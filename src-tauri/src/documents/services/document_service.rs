use sea_orm::*;
use crate::database::DatabaseManager;
use crate::documents::entities::DocumentModel;
use crate::documents::repositories::DocumentRepository;

pub struct DocumentService {
    db_manager: DatabaseManager,
}

impl DocumentService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        Self {
            db_manager: db_manager.clone(),
        }
    }

    pub async fn get_all_documents(&self) -> Result<Vec<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.get_all().await
    }

    pub async fn get_document(&self, id: i32) -> Result<Option<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.get_by_id(id).await
    }

    pub async fn get_document_by_uuid(&self, uuid: &str) -> Result<Option<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.get_by_uuid(uuid).await
    }

    pub async fn get_documents_by_project(&self, project_id: i32) -> Result<Vec<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.get_by_project(project_id).await
    }

    pub async fn get_documents_by_deployment(&self, deployment_id: &str) -> Result<Vec<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.get_by_deployment(deployment_id).await
    }

    pub async fn create_document(
        &self,
        title: String,
        content: String,
        project_id: Option<i32>,
        deployment_id: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Result<DocumentModel, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.create(title, content, project_id, deployment_id, tags).await
    }

    pub async fn update_draft(
        &self,
        id: i32,
        content_draft: String,
    ) -> Result<Option<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.update_draft(id, content_draft).await
    }

    pub async fn save_document(
        &self,
        id: i32,
        title: Option<String>,
        content: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Result<Option<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.save_document(id, title, content, tags).await
    }

    pub async fn update_metadata(
        &self,
        id: i32,
        title: Option<String>,
        project_id: Option<i32>,
        deployment_id: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Result<Option<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.update_metadata(id, title, project_id, deployment_id, tags).await
    }

    pub async fn delete_document(&self, id: i32) -> Result<bool, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.delete(id).await
    }

    pub async fn search_documents(
        &self,
        query: &str,
        project_id: Option<i32>,
        tags: Option<Vec<String>>,
    ) -> Result<Vec<DocumentModel>, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.search(query, project_id, tags).await
    }

    pub async fn get_document_stats(&self) -> Result<crate::documents::repositories::DocumentStats, DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repo = DocumentRepository::new(conn);
        repo.get_stats().await
    }
}
