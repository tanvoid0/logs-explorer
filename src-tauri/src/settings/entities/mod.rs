pub mod ide_settings;
pub mod app_settings;

// Re-export specific types to avoid conflicts
pub use ide_settings::{Entity as IDESettingsEntity, Model as IDESettingsModel, ActiveModel as IDESettingsActiveModel, Column as IDESettingsColumn};
pub use app_settings::{Entity as AppSettingsEntity, Model as AppSettingsModel, ActiveModel as AppSettingsActiveModel, Column as AppSettingsColumn};
