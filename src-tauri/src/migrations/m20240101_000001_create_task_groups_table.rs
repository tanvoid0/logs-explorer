use sea_orm_migration::prelude::*;

/// Migration: Create task_groups table
/// 
/// This migration creates the task_groups table with the following structure:
/// - id: Primary key (auto-increment)
/// - uuid: Unique identifier for the task group
/// - name: Display name of the task group
/// - description: Optional description
/// - color: Color code for UI display (default: #3B82F6)
/// - resource_link_type: Type of linked resource (optional)
/// - resource_link_id: ID of linked resource (optional)
/// - resource_link_name: Name of linked resource (optional)
/// - linked_at: Timestamp when resource was linked (optional)
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
                    .table(TaskGroups::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(TaskGroups::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(TaskGroups::Uuid).string().not_null().unique_key())
                    .col(ColumnDef::new(TaskGroups::Name).string().not_null())
                    .col(ColumnDef::new(TaskGroups::Description).string())
                    .col(ColumnDef::new(TaskGroups::Color).string().not_null().default("'#3B82F6'"))
                    .col(ColumnDef::new(TaskGroups::ResourceLinkType).string())
                    .col(ColumnDef::new(TaskGroups::ResourceLinkId).string())
                    .col(ColumnDef::new(TaskGroups::ResourceLinkName).string())
                    .col(ColumnDef::new(TaskGroups::LinkedAt).timestamp())
                    .col(ColumnDef::new(TaskGroups::CreatedAt).timestamp().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(TaskGroups::UpdatedAt).timestamp().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TaskGroups::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum TaskGroups {
    Table,
    Id,
    Uuid,
    Name,
    Description,
    Color,
    ResourceLinkType,
    ResourceLinkId,
    ResourceLinkName,
    LinkedAt,
    CreatedAt,
    UpdatedAt,
}
