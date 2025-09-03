use sea_orm_migration::prelude::*;

/// Migration: Create documents table
/// 
/// This migration creates the documents table with the following structure:
/// - id: Primary key (auto-increment)
/// - uuid: Unique identifier for the document
/// - title: Document title
/// - content: Markdown content
/// - content_draft: Draft content for caching (like Sublime Text)
/// - is_draft: Whether the document is in draft mode
/// - project_id: Optional link to a project (foreign key)
/// - deployment_id: Optional link to a deployment (foreign key)
/// - tags: JSON array of tags
/// - created_at: Timestamp when record was created
/// - updated_at: Timestamp when record was last updated
/// - last_edited_at: Timestamp when content was last edited
/// 
/// Foreign Keys:
/// - project_id references projects(id) ON DELETE SET NULL
/// - deployment_id references deployments(id) ON DELETE SET NULL (future table)
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Documents::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Documents::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Documents::Uuid).string().not_null().unique_key())
                    .col(ColumnDef::new(Documents::Title).string().not_null())
                    .col(ColumnDef::new(Documents::Content).text().not_null())
                    .col(ColumnDef::new(Documents::ContentDraft).text())
                    .col(ColumnDef::new(Documents::IsDraft).boolean().not_null().default(false))
                    .col(ColumnDef::new(Documents::ProjectId).integer())
                    .col(ColumnDef::new(Documents::DeploymentId).string())
                    .col(ColumnDef::new(Documents::Tags).json())
                    .col(ColumnDef::new(Documents::CreatedAt).timestamp().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Documents::UpdatedAt).timestamp().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Documents::LastEditedAt).timestamp().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_documents_project_id")
                            .from(Documents::Table, Documents::ProjectId)
                            .to(Projects::Table, Projects::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Documents::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Documents {
    Table,
    Id,
    Uuid,
    Title,
    Content,
    ContentDraft,
    IsDraft,
    ProjectId,
    DeploymentId,
    Tags,
    CreatedAt,
    UpdatedAt,
    LastEditedAt,
}

#[derive(DeriveIden)]
enum Projects {
    Table,
    Id,
}
