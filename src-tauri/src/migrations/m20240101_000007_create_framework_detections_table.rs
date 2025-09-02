use sea_orm_migration::prelude::*;

/// Migration: Create framework_detections table
///
/// This migration creates the framework_detections table with the following structure:
/// - id: Primary key (auto-increment)
/// - framework_id: Foreign key reference to frameworks(id)
/// - project_path: Path to the project where framework was detected
/// - detection_method: Method used for detection (e.g., "file_pattern", "package_analysis")
/// - confidence_score: Confidence score of the detection (0.0 to 1.0)
/// - detected_files: JSON array of files that triggered the detection
/// - metadata: JSON object with additional detection metadata
/// - created_at: Timestamp when detection was recorded
///
/// Foreign Keys:
/// - framework_id references frameworks(id) ON DELETE CASCADE
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(FrameworkDetections::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(FrameworkDetections::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(FrameworkDetections::FrameworkId).integer().not_null())
                    .col(ColumnDef::new(FrameworkDetections::ProjectPath).string().not_null())
                    .col(ColumnDef::new(FrameworkDetections::DetectionMethod).string().not_null())
                    .col(ColumnDef::new(FrameworkDetections::ConfidenceScore).double().not_null())
                    .col(ColumnDef::new(FrameworkDetections::DetectedFiles).string().null())
                    .col(ColumnDef::new(FrameworkDetections::Metadata).string().null())
                    .col(ColumnDef::new(FrameworkDetections::CreatedAt).timestamp().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_framework_detections_framework_id")
                            .from(FrameworkDetections::Table, FrameworkDetections::FrameworkId)
                            .to(Frameworks::Table, Frameworks::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(FrameworkDetections::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum FrameworkDetections {
    Table,
    Id,
    FrameworkId,
    ProjectPath,
    DetectionMethod,
    ConfidenceScore,
    DetectedFiles,
    Metadata,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Frameworks {
    Table,
    Id,
}
