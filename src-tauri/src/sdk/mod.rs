// SDK management module - SDK detection and management functionality
// This module contains SDK-related utilities, managers, and command handlers

pub mod detector;
pub mod manager;
pub mod commands;

// Re-export main types for easy access
pub use detector::detect_sdk_manager;
pub use manager::get_shell_info;
