use crate::frameworks::entities::FrameworkDetectionModel;
use crate::frameworks::repositories::FrameworkDetectionRepository;
use crate::database::DatabaseManager;

/// Service for handling framework detection business logic
pub struct FrameworkDetectionService {
    repository: FrameworkDetectionRepository,
}

impl FrameworkDetectionService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        let repository = FrameworkDetectionRepository::new(db_manager.get_connection_clone());
        Self { repository }
    }

    /// Get all framework detections
    pub async fn get_all_framework_detections(&self) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        self.repository.get_all().await
    }

    /// Get framework detections by project path
    pub async fn get_framework_detections_by_project_path(&self, project_path: &str) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        self.repository.get_by_project_path(project_path).await
    }

    /// Get framework detections by framework
    pub async fn get_framework_detections_by_framework(&self, framework_id: i32) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        self.repository.get_by_framework(framework_id).await
    }

    /// Create a new framework detection
    pub async fn create_framework_detection(
        &self,
        project_path: String,
        framework_id: i32,
        confidence_score: f64,
        detected_files: Vec<String>,
        metadata: Option<serde_json::Value>,
    ) -> Result<FrameworkDetectionModel, sea_orm::DbErr> {
        self.repository.create(
            project_path,
            framework_id,
            "automatic".to_string(), // Default detection method
            confidence_score,
            detected_files,
            metadata,
        ).await
    }

    /// Update an existing framework detection
    pub async fn update_framework_detection(
        &self,
        id: i32,
        confidence_score: f64,
        detected_files: Vec<String>,
        metadata: Option<serde_json::Value>,
    ) -> Result<Option<FrameworkDetectionModel>, sea_orm::DbErr> {
        self.repository.update(id, confidence_score, detected_files, metadata).await
    }

    /// Delete a framework detection
    pub async fn delete_framework_detection(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        self.repository.delete(id).await
    }

    /// Get detection statistics
    pub async fn get_detection_stats(&self) -> Result<serde_json::Value, sea_orm::DbErr> {
        self.repository.get_stats().await
    }

    /// Get high confidence framework detections
    pub async fn get_high_confidence_framework_detections(&self, threshold: f64) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        self.repository.get_high_confidence(threshold).await
    }

    /// Get recent framework detections
    pub async fn get_recent_framework_detections(&self, limit: i32) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        self.repository.get_recent(limit).await
    }
}
