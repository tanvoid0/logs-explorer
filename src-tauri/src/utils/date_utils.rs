use chrono::{DateTime, Utc, NaiveDateTime, TimeZone};

/// Convert a string to a DateTime<Utc>
pub fn parse_datetime_string(date_string: &str) -> Result<DateTime<Utc>, chrono::ParseError> {
    DateTime::parse_from_rfc3339(date_string)
        .map(|dt| dt.with_timezone(&Utc))
}

/// Convert a DateTime<Utc> to a string
pub fn format_datetime_string(datetime: &DateTime<Utc>) -> String {
    datetime.to_rfc3339()
}

/// Get current timestamp as DateTime<Utc>
pub fn now() -> DateTime<Utc> {
    Utc::now()
}

/// Convert NaiveDateTime to DateTime<Utc>
pub fn naive_to_utc(naive: NaiveDateTime) -> DateTime<Utc> {
    Utc.from_utc_datetime(&naive)
}

/// Convert DateTime<Utc> to NaiveDateTime
pub fn utc_to_naive(utc: DateTime<Utc>) -> NaiveDateTime {
    utc.naive_utc()
}

/// Check if a date is in the past
pub fn is_past(date: &DateTime<Utc>) -> bool {
    date < &now()
}

/// Check if a date is in the future
pub fn is_future(date: &DateTime<Utc>) -> bool {
    date > &now()
}

/// Get days until a date
pub fn days_until(date: &DateTime<Utc>) -> i64 {
    let now = now();
    (date.date_naive() - now.date_naive()).num_days()
}
