use chrono::{DateTime, Utc};

/// Get the next status in the task workflow
pub fn get_next_task_status(current_status: &str) -> &'static str {
    match current_status {
        "pending" => "in-progress",
        "in-progress" => "completed",
        "completed" => "pending",
        _ => "pending",
    }
}

/// Get the previous status in the task workflow
pub fn get_previous_task_status(current_status: &str) -> &'static str {
    match current_status {
        "completed" => "in-progress",
        "in-progress" => "pending",
        "pending" => "completed",
        _ => "pending",
    }
}

/// Check if a task is overdue
pub fn is_task_overdue(due_date: &DateTime<Utc>) -> bool {
    due_date < &Utc::now()
}

/// Get days until task is due
pub fn days_until_due(due_date: &DateTime<Utc>) -> i64 {
    let now = Utc::now();
    (due_date.date_naive() - now.date_naive()).num_days()
}

/// Get task priority level as integer for sorting
pub fn get_priority_level(priority: &str) -> i32 {
    match priority {
        "high" => 3,
        "medium" => 2,
        "low" => 1,
        _ => 0,
    }
}

/// Get default task color based on priority
pub fn get_default_task_color(priority: &str) -> &'static str {
    match priority {
        "high" => "#EF4444",    // Red
        "medium" => "#F59E0B",  // Amber
        "low" => "#10B981",     // Green
        _ => "#6B7280",         // Gray
    }
}

/// Get default task group color
pub fn get_default_task_group_color() -> &'static str {
    "#3B82F6" // Blue
}

/// Format task due date for display
pub fn format_task_due_date(due_date: &DateTime<Utc>) -> String {
    let now = Utc::now();
    let days_diff = (due_date.date_naive() - now.date_naive()).num_days();
    
    match days_diff {
        0 => "Today".to_string(),
        1 => "Tomorrow".to_string(),
        -1 => "Yesterday".to_string(),
        d if d > 0 => format!("In {} days", d),
        d if d < 0 => format!("{} days ago", d.abs()),
        _ => due_date.format("%Y-%m-%d").to_string(),
    }
}

/// Get task status display name
pub fn get_task_status_display_name(status: &str) -> &'static str {
    match status {
        "pending" => "Pending",
        "in-progress" => "In Progress",
        "completed" => "Completed",
        "cancelled" => "Cancelled",
        _ => "Unknown",
    }
}

/// Get task priority display name
pub fn get_task_priority_display_name(priority: &str) -> &'static str {
    match priority {
        "low" => "Low",
        "medium" => "Medium",
        "high" => "High",
        _ => "Unknown",
    }
}
