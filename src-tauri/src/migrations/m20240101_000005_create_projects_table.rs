use sea_orm_migration::prelude::*;

/// Migration: Create projects table
///
/// This migration creates the projects table with the following structure:
/// - id: Primary key (auto-increment)
/// - name: Project display name
/// - path: File system path to the project
/// - framework: Detected or manually set framework (optional)
/// - deployment: Associated Kubernetes deployment (optional)
/// - starred: Boolean flag for starred/favorite projects
/// - created_at: Timestamp when record was created
/// - updated_at: Timestamp when record was last updated
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Projects::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Projects::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Projects::Name).string().not_null())
                    .col(ColumnDef::new(Projects::Path).string().not_null())
                    .col(ColumnDef::new(Projects::Framework).string().null())
                    .col(ColumnDef::new(Projects::Deployment).string().null())
                    .col(ColumnDef::new(Projects::Starred).boolean().not_null().default(false))
                    .col(ColumnDef::new(Projects::CreatedAt).timestamp().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Projects::UpdatedAt).timestamp().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Projects::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Projects {
    Table,
    Id,
    Name,
    Path,
    Framework,
    Deployment,
    Starred,
    CreatedAt,
    UpdatedAt,
}
