// Tasks domain module - Task management functionality
// This module contains task-related entities, services, repositories, and utilities

pub mod entities;
pub mod services;
pub mod repositories;
pub mod commands;
pub mod utils;

// Re-export main types for easy access
pub use entities::{TaskEntity, TaskModel, TaskActiveModel, TaskColumn};
pub use entities::{TaskGroupEntity, TaskGroupModel, TaskGroupActiveModel, TaskGroupColumn};
pub use services::{TaskService, TaskGroupService};
pub use repositories::{TaskGroupRepository};
