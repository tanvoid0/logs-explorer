use std::fmt;

/// Custom error types for the application
#[derive(Debug)]
pub enum AppError {
    DatabaseError(String),
    ValidationError(String),
    NotFoundError(String),
    InvalidInputError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AppError::NotFoundError(msg) => write!(f, "Not found: {}", msg),
            AppError::InvalidInputError(msg) => write!(f, "Invalid input: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

/// Convert database errors to application errors
pub fn map_db_error(error: sea_orm::DbErr) -> AppError {
    AppError::DatabaseError(error.to_string())
}

/// Create a validation error
pub fn validation_error(message: &str) -> AppError {
    AppError::ValidationError(message.to_string())
}

/// Create a not found error
pub fn not_found_error(message: &str) -> AppError {
    AppError::NotFoundError(message.to_string())
}

/// Create an invalid input error
pub fn invalid_input_error(message: &str) -> AppError {
    AppError::InvalidInputError(message.to_string())
}
