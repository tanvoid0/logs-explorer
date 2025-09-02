use sea_orm_migration::prelude::*;

/// Migration: Create ide_configs table
///
/// This migration creates the ide_configs table with the following structure:
/// - id: Primary key (auto-increment)
/// - name: Display name of the IDE
/// - executable: Command name or path to the IDE executable
/// - is_default: Boolean flag indicating if this is the default IDE
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
                    .table(IdeConfigs::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(IdeConfigs::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(IdeConfigs::Name).string().not_null())
                    .col(ColumnDef::new(IdeConfigs::Executable).string().not_null())
                    .col(ColumnDef::new(IdeConfigs::IsDefault).boolean().not_null().default(false))
                    .col(ColumnDef::new(IdeConfigs::CreatedAt).timestamp().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(IdeConfigs::UpdatedAt).timestamp().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(IdeConfigs::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum IdeConfigs {
    Table,
    Id,
    Name,
    Executable,
    IsDefault,
    CreatedAt,
    UpdatedAt,
}
