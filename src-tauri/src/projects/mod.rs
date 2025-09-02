// Projects domain module - Project management functionality
// This module contains project-related entities, services, repositories, and utilities

pub mod entities;
pub mod services;
pub mod repositories;
pub mod commands;
pub mod utils;

// Re-export main types for easy access
pub use entities::{ProjectEntity, ProjectModel, ProjectActiveModel, ProjectColumn};
pub use services::project_service::ProjectService;
pub use repositories::ProjectRepository;
