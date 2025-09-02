use sea_orm_migration::prelude::*;

/// Migration: Create frameworks table
///
/// This migration creates the frameworks table with the following structure:
/// - id: Primary key (auto-increment)
/// - name: Framework name (e.g., "React", "Django", "Spring Boot")
/// - category: Framework category (e.g., "Frontend", "Backend", "Mobile")
/// - description: Optional description of the framework
/// - version: Optional version information
/// - website: Optional website URL
/// - documentation_url: Optional documentation URL
/// - is_active: Boolean flag indicating if framework is active
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
                    .table(Frameworks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Frameworks::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Frameworks::Name).string().not_null())
                    .col(ColumnDef::new(Frameworks::Category).string().not_null())
                    .col(ColumnDef::new(Frameworks::Description).string().null())
                    .col(ColumnDef::new(Frameworks::Version).string().null())
                    .col(ColumnDef::new(Frameworks::Website).string().null())
                    .col(ColumnDef::new(Frameworks::DocumentationUrl).string().null())
                    .col(ColumnDef::new(Frameworks::IsActive).boolean().not_null().default(true))
                    .col(ColumnDef::new(Frameworks::CreatedAt).timestamp().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Frameworks::UpdatedAt).timestamp().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Frameworks::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Frameworks {
    Table,
    Id,
    Name,
    Category,
    Description,
    Version,
    Website,
    DocumentationUrl,
    IsActive,
    CreatedAt,
    UpdatedAt,
}
