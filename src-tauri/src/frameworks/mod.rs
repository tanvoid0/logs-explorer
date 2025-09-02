// Frameworks domain module - Framework management functionality
// This module contains framework-related entities, services, repositories, and utilities

pub mod entities;
pub mod services;
pub mod repositories;
pub mod commands;
pub mod utils;

// Re-export main types for easy access
pub use entities::{FrameworkEntity, FrameworkModel, FrameworkActiveModel, FrameworkColumn};
pub use services::{FrameworkService, FrameworkDetectionService};
pub use repositories::FrameworkRepository;
