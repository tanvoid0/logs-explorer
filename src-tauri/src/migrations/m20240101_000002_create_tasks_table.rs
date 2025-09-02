use sea_orm_migration::prelude::*;

/// Migration: Create tasks table
/// 
/// This migration creates the tasks table with the following structure:
/// - id: Primary key (auto-increment)
/// - uuid: Unique identifier for the task
/// - title: Display title of the task
/// - description: Optional description
/// - status: Current status (pending, in-progress, completed, cancelled)
/// - priority: Priority level (low, medium, high)
/// - due_date: Optional due date
/// - parent_id: UUID of parent task (for subtasks)
/// - group_id: UUID of task group this task belongs to
/// - created_at: Timestamp when record was created
/// - updated_at: Timestamp when record was last updated
/// 
/// Foreign Keys:
/// - parent_id references tasks(uuid) ON DELETE CASCADE
/// - group_id references task_groups(uuid) ON DELETE CASCADE
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Tasks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Tasks::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Tasks::Uuid).string().not_null().unique_key())
                    .col(ColumnDef::new(Tasks::Title).string().not_null())
                    .col(ColumnDef::new(Tasks::Description).string())
                    .col(ColumnDef::new(Tasks::Status).string().not_null().default("'pending'"))
                    .col(ColumnDef::new(Tasks::Priority).string().not_null().default("'medium'"))
                    .col(ColumnDef::new(Tasks::DueDate).timestamp())
                    .col(ColumnDef::new(Tasks::ParentId).string())
                    .col(ColumnDef::new(Tasks::GroupId).string())
                    .col(ColumnDef::new(Tasks::CreatedAt).timestamp().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Tasks::UpdatedAt).timestamp().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_tasks_parent_id")
                            .from(Tasks::Table, Tasks::ParentId)
                            .to(Tasks::Table, Tasks::Uuid)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_tasks_group_id")
                            .from(Tasks::Table, Tasks::GroupId)
                            .to(TaskGroups::Table, TaskGroups::Uuid)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Tasks::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Tasks {
    Table,
    Id,
    Uuid,
    Title,
    Description,
    Status,
    Priority,
    DueDate,
    ParentId,
    GroupId,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum TaskGroups {
    Table,
    Uuid,
}
