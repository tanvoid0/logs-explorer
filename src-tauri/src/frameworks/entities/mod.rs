pub mod framework;
pub mod framework_detection;

// Re-export entities for easy access
pub use framework::{Entity as FrameworkEntity, Model as FrameworkModel, ActiveModel as FrameworkActiveModel, Column as FrameworkColumn};
pub use framework_detection::{Entity as FrameworkDetectionEntity, Model as FrameworkDetectionModel, ActiveModel as FrameworkDetectionActiveModel, Column as FrameworkDetectionColumn};

// Type aliases for easier use
pub type Framework = FrameworkModel;
pub type FrameworkDetection = FrameworkDetectionModel;
