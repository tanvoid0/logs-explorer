// Settings domain module - Application settings management functionality
// This module contains settings-related entities, services, repositories, and utilities

pub mod entities;
pub mod services;
pub mod repositories;
pub mod commands;
pub mod utils;

// Re-export main types for easy access
pub use entities::{IDESettingsEntity, IDESettingsModel, IDESettingsActiveModel, IDESettingsColumn,
                  AppSettingsEntity, AppSettingsModel, AppSettingsActiveModel, AppSettingsColumn};
pub use services::SettingsService;
