# Advanced Log Filtering System

The Logs Explorer now includes a highly customizable advanced filtering system that allows developers to create complex, multi-condition filters for log analysis.

## Features

### 🎯 **Multiple Filter Types**
- **Text-based filters**: Contains, starts with, ends with, regex matching
- **Numeric filters**: Greater than, less than, equals, ranges
- **Logical operators**: AND, OR combinations
- **Null/Empty checks**: Filter for missing or empty fields
- **List operations**: In/Not in lists of values

### 🔧 **Available Fields**
- **Basic log fields**: message, level, namespace, pod, container, timestamp
- **Structured log fields**: severity, logger, requestId, traceId, userId, error, stackTrace
- **HTTP fields**: method, url, statusCode, duration
- **Custom fields**: Any field present in structured JSON logs

### 🚀 **Operators**

#### Text Operators
- `equals` - Exact match
- `not_equals` - Exact non-match
- `contains` - Contains text
- `not_contains` - Does not contain text
- `starts_with` - Begins with text
- `ends_with` - Ends with text
- `regex` - Regular expression match
- `not_regex` - Does not match regex

#### Numeric Operators
- `greater_than` - Numeric comparison
- `less_than` - Numeric comparison
- `greater_than_equal` - Numeric comparison
- `less_than_equal` - Numeric comparison

#### List Operators
- `in` - Value in comma-separated list
- `not_in` - Value not in comma-separated list

#### Null Operators
- `is_null` - Field is null or empty
- `is_not_null` - Field is not null or empty

## Usage

### 1. **Quick Templates**
The system includes predefined templates for common filtering scenarios:

- **Error Logs**: Show only error and warning logs
- **Slow Requests**: Requests taking longer than 1 second
- **Failed Requests**: HTTP requests with 4xx or 5xx status codes
- **Database Errors**: Logs containing database-related errors

### 2. **Custom Filters**

#### Creating a Filter Group
1. Click "Advanced Filters" to expand the filtering interface
2. Click "Add Filter Group" to create a new group
3. Set the group operator (AND/OR)
4. Add conditions to the group

#### Adding Conditions
1. Select a field from the dropdown
2. Choose an operator appropriate for the field type
3. Enter the value to filter by
4. Enable/disable the condition as needed

#### Example: Complex Filter
```
Group 1 (AND):
  - severity equals "ERROR"
  - duration greater_than "1000"

Group 2 (OR):
  - message contains "database"
  - message contains "connection"
```

This filter will show error logs with duration > 1000ms OR logs containing "database" or "connection" in the message.

### 3. **Field-Specific Behavior**

#### Text Fields
- Supports all text operators
- Case-insensitive matching
- Regex support with validation

#### Numeric Fields
- Supports numeric comparison operators
- Automatic type conversion
- Validation for numeric values

#### Select Fields
- Dropdown with predefined options
- Supports equals, not_equals, in, not_in operators

#### DateTime Fields
- Date picker interface
- Supports temporal comparisons
- ISO format validation

## Examples

### Find All Error Logs from a Specific Service
```
Field: logger
Operator: equals
Value: app.database
```

### Find Slow API Requests
```
Field: duration
Operator: greater_than
Value: 1000
```

### Find Logs with Specific Trace ID
```
Field: traceId
Operator: equals
Value: trace-456
```

### Find Database Errors (Multiple Conditions)
```
Group (OR):
  - Field: message, Operator: contains, Value: database
  - Field: message, Operator: contains, Value: sql
  - Field: message, Operator: contains, Value: connection
```

### Find Failed Requests with High Duration
```
Group 1 (AND):
  - Field: statusCode, Operator: greater_than_equal, Value: 400
  - Field: duration, Operator: greater_than, Value: 2000
```

## Developer Experience

### 🔍 **Real-time Filtering**
- Filters are applied immediately as you type
- No need to click "Apply" for basic changes
- Visual feedback shows active filter count

### 🎨 **Intuitive Interface**
- Drag-and-drop style condition management
- Context-sensitive operator selection
- Field type validation and suggestions

### 📊 **Filter Summary**
- Shows active filter count in the UI
- Quick clear all filters option
- Template-based quick setup

### 🔧 **Validation**
- Regex syntax validation
- Numeric value validation
- DateTime format validation
- Real-time error feedback

## Technical Implementation

### Client-Side Filtering
- All filtering happens client-side for immediate response
- Supports complex nested conditions
- Efficient filtering algorithms

### Backend Integration
- Can generate search queries for backend systems
- Compatible with various log aggregation platforms
- Extensible for custom field types

### Performance
- Optimized for large log datasets
- Lazy evaluation of filter conditions
- Memory-efficient filtering

## Best Practices

1. **Start Simple**: Use templates for common scenarios
2. **Group Related Conditions**: Use AND/OR groups logically
3. **Validate Inputs**: Check regex patterns and numeric values
4. **Test Filters**: Verify results match expectations
5. **Save Common Filters**: Create templates for repeated use

## Future Enhancements

- **Saved Filter Presets**: Save and load custom filter configurations
- **Filter History**: Track recently used filters
- **Advanced Regex**: Visual regex builder
- **Filter Analytics**: Show filter effectiveness metrics
- **Export Filters**: Share filter configurations
- **API Integration**: Direct integration with log aggregation APIs
