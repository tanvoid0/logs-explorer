/// Validate task status
pub fn is_valid_task_status(status: &str) -> bool {
    matches!(status, "pending" | "in-progress" | "completed" | "cancelled")
}

/// Validate task priority
pub fn is_valid_task_priority(priority: &str) -> bool {
    matches!(priority, "low" | "medium" | "high")
}

/// Validate task title
pub fn is_valid_task_title(title: &str) -> bool {
    !title.trim().is_empty() && title.len() <= 255
}

/// Validate task description
pub fn is_valid_task_description(description: &str) -> bool {
    description.len() <= 1000
}

/// Validate task group name
pub fn is_valid_task_group_name(name: &str) -> bool {
    !name.trim().is_empty() && name.len() <= 255
}

/// Validate task group color
pub fn is_valid_task_group_color(color: &str) -> bool {
    color.starts_with('#') && color.len() == 7 && color[1..].chars().all(|c| c.is_ascii_hexdigit())
}

/// Sanitize task title
pub fn sanitize_task_title(title: &str) -> String {
    title.trim().to_string()
}

/// Sanitize task description
pub fn sanitize_task_description(description: &str) -> String {
    description.trim().to_string()
}

/// Validate and sanitize task title
pub fn validate_and_sanitize_task_title(title: &str) -> Result<String, String> {
    let sanitized = sanitize_task_title(title);
    if is_valid_task_title(&sanitized) {
        Ok(sanitized)
    } else {
        Err("Task title must not be empty and must be 255 characters or less".to_string())
    }
}

/// Validate and sanitize task description
pub fn validate_and_sanitize_task_description(description: &str) -> Result<String, String> {
    let sanitized = sanitize_task_description(description);
    if is_valid_task_description(&sanitized) {
        Ok(sanitized)
    } else {
        Err("Task description must be 1000 characters or less".to_string())
    }
}
