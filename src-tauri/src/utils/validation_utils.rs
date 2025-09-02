use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    static ref UUID_REGEX: Regex = Regex::new(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$").expect("Invalid UUID regex pattern");
    static ref EMAIL_REGEX: Regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").expect("Invalid email regex pattern");
    static ref COLOR_HEX_REGEX: Regex = Regex::new(r"^#[0-9A-Fa-f]{6}$").expect("Invalid hex color regex pattern");
}

/// Validate if a string is a valid UUID
pub fn is_valid_uuid(uuid: &str) -> bool {
    UUID_REGEX.is_match(uuid)
}

/// Validate if a string is a valid email
pub fn is_valid_email(email: &str) -> bool {
    EMAIL_REGEX.is_match(email)
}

/// Validate if a string is a valid hex color
pub fn is_valid_hex_color(color: &str) -> bool {
    COLOR_HEX_REGEX.is_match(color)
}

/// Validate if a string is not empty and has reasonable length
pub fn is_valid_name(name: &str) -> bool {
    !name.trim().is_empty() && name.len() <= 255
}

/// Validate if a string is a valid description
pub fn is_valid_description(description: &str) -> bool {
    description.len() <= 1000
}

/// Validate task status
pub fn is_valid_task_status(status: &str) -> bool {
    matches!(status, "pending" | "in-progress" | "completed" | "cancelled")
}

/// Validate task priority
pub fn is_valid_task_priority(priority: &str) -> bool {
    matches!(priority, "low" | "medium" | "high")
}

/// Validate resource link type
pub fn is_valid_resource_link_type(link_type: &str) -> bool {
    matches!(link_type, "project" | "file" | "url" | "k8s" | "ide")
}

/// Sanitize a string for database storage
pub fn sanitize_string(input: &str) -> String {
    input.trim().to_string()
}

/// Validate and sanitize a name
pub fn validate_and_sanitize_name(name: &str) -> Result<String, String> {
    let sanitized = sanitize_string(name);
    if is_valid_name(&sanitized) {
        Ok(sanitized)
    } else {
        Err("Name must not be empty and must be 255 characters or less".to_string())
    }
}

/// Validate and sanitize a description
pub fn validate_and_sanitize_description(description: &str) -> Result<String, String> {
    let sanitized = sanitize_string(description);
    if is_valid_description(&sanitized) {
        Ok(sanitized)
    } else {
        Err("Description must be 1000 characters or less".to_string())
    }
}
