use sea_orm_migration::prelude::*;

/// Migration: Create framework_ide_mappings table
///
/// This migration creates the framework_ide_mappings table with the following structure:
/// - id: Primary key (auto-increment)
/// - framework: Framework name (e.g., "React", "Python", "Go")
/// - ide_id: Foreign key reference to ide_configs(id)
/// - created_at: Timestamp when record was created
/// - updated_at: Timestamp when record was last updated
///
/// Foreign Keys:
/// - ide_id references ide_configs(id) ON DELETE CASCADE
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(FrameworkIdeMappings::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(FrameworkIdeMappings::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(FrameworkIdeMappings::Framework).string().not_null())
                    .col(ColumnDef::new(FrameworkIdeMappings::IdeId).integer().not_null())
                    .col(ColumnDef::new(FrameworkIdeMappings::CreatedAt).timestamp().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(FrameworkIdeMappings::UpdatedAt).timestamp().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_framework_ide_mappings_ide_id")
                            .from(FrameworkIdeMappings::Table, FrameworkIdeMappings::IdeId)
                            .to(IdeConfigs::Table, IdeConfigs::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(FrameworkIdeMappings::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum FrameworkIdeMappings {
    Table,
    Id,
    Framework,
    IdeId,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum IdeConfigs {
    Table,
    Id,
}
