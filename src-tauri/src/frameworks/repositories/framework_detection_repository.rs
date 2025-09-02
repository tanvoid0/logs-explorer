use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, DatabaseConnection, QuerySelect, QueryOrder, PaginatorTrait};
use chrono::Utc;
use serde_json;

use crate::frameworks::entities::{FrameworkDetectionEntity, FrameworkDetectionModel, FrameworkDetectionActiveModel, FrameworkDetectionColumn};

/// Repository for framework detection database operations
pub struct FrameworkDetectionRepository {
    conn: DatabaseConnection,
}

impl FrameworkDetectionRepository {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }

    /// Get all framework detections
    pub async fn get_all(&self) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        FrameworkDetectionEntity::find()
            .order_by_desc(FrameworkDetectionColumn::CreatedAt)
            .all(&self.conn)
            .await
    }

    /// Get framework detections by project path
    pub async fn get_by_project_path(&self, project_path: &str) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        FrameworkDetectionEntity::find()
            .filter(FrameworkDetectionColumn::ProjectPath.eq(project_path))
            .order_by_desc(FrameworkDetectionColumn::CreatedAt)
            .all(&self.conn)
            .await
    }

    /// Get framework detections by framework ID
    pub async fn get_by_framework(&self, framework_id: i32) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        FrameworkDetectionEntity::find()
            .filter(FrameworkDetectionColumn::FrameworkId.eq(framework_id))
            .order_by_desc(FrameworkDetectionColumn::CreatedAt)
            .all(&self.conn)
            .await
    }

    /// Create a new framework detection
    pub async fn create(
        &self,
        project_path: String,
        framework_id: i32,
        detection_method: String,
        confidence_score: f64,
        detected_files: Vec<String>,
        metadata: Option<serde_json::Value>,
    ) -> Result<FrameworkDetectionModel, sea_orm::DbErr> {
        let detected_files_json = serde_json::to_string(&detected_files)
            .map_err(|_| sea_orm::DbErr::Custom("Failed to serialize detected files".to_string()))?;
        
        let metadata_json = metadata
            .map(|m| serde_json::to_string(&m))
            .transpose()
            .map_err(|_| sea_orm::DbErr::Custom("Failed to serialize metadata".to_string()))?;

        let detection = FrameworkDetectionActiveModel {
            id: sea_orm::ActiveValue::NotSet,
            framework_id: sea_orm::ActiveValue::Set(framework_id),
            project_path: sea_orm::ActiveValue::Set(project_path),
            detection_method: sea_orm::ActiveValue::Set(detection_method),
            confidence_score: sea_orm::ActiveValue::Set(confidence_score),
            detected_files: sea_orm::ActiveValue::Set(Some(detected_files_json)),
            metadata: sea_orm::ActiveValue::Set(metadata_json),
            created_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
        };

        detection.insert(&self.conn).await
    }

    /// Update an existing framework detection
    pub async fn update(
        &self,
        id: i32,
        confidence_score: f64,
        detected_files: Vec<String>,
        metadata: Option<serde_json::Value>,
    ) -> Result<Option<FrameworkDetectionModel>, sea_orm::DbErr> {
        let detection = FrameworkDetectionEntity::find()
            .filter(FrameworkDetectionColumn::Id.eq(id))
            .one(&self.conn)
            .await?;

        if let Some(detection) = detection {
            let detected_files_json = serde_json::to_string(&detected_files)
                .map_err(|_| sea_orm::DbErr::Custom("Failed to serialize detected files".to_string()))?;
            
            let metadata_json = metadata
                .map(|m| serde_json::to_string(&m))
                .transpose()
                .map_err(|_| sea_orm::DbErr::Custom("Failed to serialize metadata".to_string()))?;

            let mut detection: FrameworkDetectionActiveModel = detection.into();
            detection.confidence_score = Set(confidence_score);
            detection.detected_files = Set(Some(detected_files_json));
            detection.metadata = Set(metadata_json);
            
            Ok(Some(detection.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Delete a framework detection
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        let result = FrameworkDetectionEntity::delete_many()
            .filter(FrameworkDetectionColumn::Id.eq(id))
            .exec(&self.conn)
            .await?;
        
        Ok(result.rows_affected > 0)
    }

    /// Get high confidence framework detections
    pub async fn get_high_confidence(&self, threshold: f64) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        FrameworkDetectionEntity::find()
            .filter(FrameworkDetectionColumn::ConfidenceScore.gte(threshold))
            .order_by_desc(FrameworkDetectionColumn::ConfidenceScore)
            .all(&self.conn)
            .await
    }

    /// Get recent framework detections
    pub async fn get_recent(&self, limit: i32) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        FrameworkDetectionEntity::find()
            .order_by_desc(FrameworkDetectionColumn::CreatedAt)
            .limit(limit as u64)
            .all(&self.conn)
            .await
    }

    /// Get detection statistics
    pub async fn get_stats(&self) -> Result<serde_json::Value, sea_orm::DbErr> {
        let total_detections = FrameworkDetectionEntity::find().count(&self.conn).await?;
        
        let high_confidence_count = FrameworkDetectionEntity::find()
            .filter(FrameworkDetectionColumn::ConfidenceScore.gte(0.8))
            .count(&self.conn)
            .await?;

        // Calculate average confidence manually since SeaORM doesn't have built-in avg for columns
        let all_detections = FrameworkDetectionEntity::find().all(&self.conn).await?;
        let avg_confidence = if all_detections.is_empty() {
            0.0
        } else {
            let sum: f64 = all_detections.iter().map(|d| d.confidence_score).sum();
            sum / all_detections.len() as f64
        };

        let stats = serde_json::json!({
            "total_detections": total_detections,
            "high_confidence_count": high_confidence_count,
            "average_confidence": avg_confidence,
            "high_confidence_percentage": if total_detections > 0 {
                (high_confidence_count as f64 / total_detections as f64) * 100.0
            } else {
                0.0
            }
        });

        Ok(stats)
    }
}
