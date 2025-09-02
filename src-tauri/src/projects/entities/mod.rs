pub mod project;

// Re-export specific types to avoid conflicts
pub use project::{Entity as ProjectEntity, Model as ProjectModel, ActiveModel as ProjectActiveModel, Column as ProjectColumn};
