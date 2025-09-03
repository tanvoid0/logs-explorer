pub mod document;

// Re-export specific types to avoid conflicts
pub use document::{Entity as DocumentEntity, Model as DocumentModel, ActiveModel as DocumentActiveModel, Column as DocumentColumn};
