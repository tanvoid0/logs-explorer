# Missing Backend Commands

This document lists all the backend Tauri commands that need to be implemented to support the new modular frontend services.

## Projects Domain

### Core Project Commands
- `get_all_projects` - Get all projects from database
- `get_project` - Get a specific project by ID
- `add_project` - Add a new project
- `update_project` - Update an existing project
- `delete_project` - Delete a project
- `toggle_project_star` - Toggle project star status
- `get_projects_with_filters` - Get projects with filtering and sorting

### Project Utilities
- `validate_project_path` - Validate if project path exists and is accessible
- `generate_project_name` - Generate a project name from path
- `detect_framework` - Detect framework from project path
- `open_project_in_explorer` - Open project folder in file explorer
- `select_directory` - Open directory selection dialog
- `open_project_with_framework_ide` - Open project in appropriate IDE

## Frameworks Domain

### Framework Management
- `get_all_frameworks` - Get all frameworks
- `get_active_frameworks` - Get only active frameworks
- `get_framework` - Get framework by ID
- `get_framework_by_name` - Get framework by name
- `create_framework` - Create new framework
- `update_framework` - Update existing framework
- `delete_framework` - Delete framework
- `toggle_framework_active` - Toggle framework active status
- `get_frameworks_by_category` - Get frameworks by category
- `get_framework_categories` - Get all framework categories
- `search_frameworks` - Search frameworks by query

### Framework Detection
- `get_all_framework_detections` - Get all framework detections
- `get_detections_by_project_path` - Get detections for specific project
- `get_detections_by_framework` - Get detections for specific framework
- `create_framework_detection` - Create new framework detection
- `update_framework_detection` - Update framework detection
- `delete_framework_detection` - Delete framework detection
- `get_framework_detection_stats` - Get detection statistics
- `get_high_confidence_detections` - Get high confidence detections
- `get_recent_detections` - Get recent detections

## Settings Domain

### IDE Settings
- `get_all_ide_settings` - Get all IDE settings
- `get_ide_settings_by_framework` - Get IDE settings for framework
- `get_default_ide_settings` - Get default IDE settings for framework
- `create_ide_settings` - Create new IDE settings
- `update_ide_settings` - Update IDE settings
- `delete_ide_settings` - Delete IDE settings
- `set_default_ide_settings` - Set default IDE settings
- `open_project_with_framework_ide` - Open project with framework IDE
- `validate_ide_path` - Validate IDE executable path
- `detect_installed_ides` - Detect installed IDEs

### App Settings
- `get_all_app_settings` - Get all app settings
- `get_app_settings_by_category` - Get settings by category
- `get_app_setting` - Get specific setting by key
- `create_app_settings` - Create new app setting
- `update_app_settings` - Update app setting
- `delete_app_settings` - Delete app setting
- `get_app_settings_categories` - Get all setting categories

### Settings Utilities
- `export_settings` - Export all settings
- `import_settings` - Import settings
- `reset_settings_to_default` - Reset settings to defaults

## SDK Domain

### SDK Management
- `get_all_sdks` - Get all SDKs
- `get_active_sdks` - Get active SDKs
- `get_sdk` - Get SDK by ID
- `get_sdk_by_name` - Get SDK by name
- `get_sdks_by_framework` - Get SDKs for framework
- `create_sdk` - Create new SDK
- `update_sdk` - Update SDK
- `delete_sdk` - Delete SDK
- `toggle_sdk_active` - Toggle SDK active status
- `search_sdks` - Search SDKs

### SDK Detection
- `get_all_sdk_detections` - Get all SDK detections
- `get_sdk_detections_by_project_path` - Get detections for project
- `get_sdk_detections_by_sdk` - Get detections for SDK
- `create_sdk_detection` - Create SDK detection
- `update_sdk_detection` - Update SDK detection
- `delete_sdk_detection` - Delete SDK detection

### SDK Utilities
- `detect_sdks_in_project` - Detect SDKs in project
- `validate_sdk_path` - Validate SDK path
- `get_sdk_version` - Get SDK version
- `install_sdk` - Install SDK
- `uninstall_sdk` - Uninstall SDK
- `update_sdk_version` - Update SDK version
- `get_sdk_stats` - Get SDK statistics

## Process Domain

### Process Execution
- `execute_command` - Execute command with full options
- `execute_command_in_directory` - Execute command in directory
- `get_process_execution` - Get execution by ID
- `get_all_process_executions` - Get all executions
- `get_recent_process_executions` - Get recent executions
- `cancel_process_execution` - Cancel execution
- `kill_process` - Kill process by PID

### Process Validation
- `validate_command` - Validate command
- `validate_working_directory` - Validate working directory
- `check_command_exists` - Check if command exists

### Process Management
- `get_running_processes` - Get running processes
- `get_process_stats` - Get process statistics
- `clear_execution_history` - Clear execution history

### Process Monitoring
- `start_process_monitoring` - Start process monitoring
- `stop_process_monitoring` - Stop process monitoring
- `is_process_monitoring_active` - Check monitoring status

### Process Utilities
- `get_system_info` - Get system information
- `get_available_commands` - Get available commands
- `get_command_help` - Get command help
- `format_command_output` - Format command output

## Automation Domain

### Pipeline Management
- `get_all_pipelines` - Get all pipelines
- `get_pipeline` - Get pipeline by ID
- `create_pipeline` - Create new pipeline
- `update_pipeline` - Update pipeline
- `delete_pipeline` - Delete pipeline
- `validate_pipeline` - Validate pipeline

### Pipeline Execution
- `execute_pipeline` - Execute pipeline
- `get_pipeline_execution` - Get execution by ID
- `get_all_pipeline_executions` - Get all executions
- `get_pipeline_executions_by_pipeline` - Get executions for pipeline
- `cancel_pipeline_execution` - Cancel execution
- `get_pipeline_execution_progress` - Get execution progress

### Pipeline Templates
- `get_all_pipeline_templates` - Get all templates
- `get_pipeline_template` - Get template by ID
- `create_pipeline_template` - Create template
- `update_pipeline_template` - Update template
- `delete_pipeline_template` - Delete template

### Pipeline Search and Filtering
- `search_pipelines` - Search pipelines
- `get_pipelines_by_framework` - Get pipelines by framework
- `get_pipelines_by_tag` - Get pipelines by tag

### Pipeline Statistics
- `get_pipeline_stats` - Get pipeline statistics
- `get_pipeline_execution_stats` - Get execution statistics

### Pipeline Import/Export
- `export_pipeline` - Export pipeline
- `import_pipeline` - Import pipeline

### Pipeline Scheduling
- `schedule_pipeline` - Schedule pipeline
- `get_scheduled_pipelines` - Get scheduled pipelines
- `cancel_scheduled_pipeline` - Cancel scheduled pipeline

## Kubernetes Domain

### Cluster Management
- `get_k8s_clusters` - Get all clusters
- `get_current_k8s_cluster` - Get current cluster
- `switch_k8s_cluster` - Switch cluster
- `add_k8s_cluster` - Add cluster
- `remove_k8s_cluster` - Remove cluster

### Namespace Management
- `get_k8s_namespaces` - Get namespaces
- `create_k8s_namespace` - Create namespace
- `delete_k8s_namespace` - Delete namespace

### Pod Management
- `get_k8s_pods` - Get pods
- `get_k8s_pod` - Get specific pod
- `delete_k8s_pod` - Delete pod
- `restart_k8s_pod` - Restart pod

### Deployment Management
- `get_k8s_deployments` - Get deployments
- `get_k8s_deployment` - Get specific deployment
- `scale_k8s_deployment` - Scale deployment
- `restart_k8s_deployment` - Restart deployment

### Service Management
- `get_k8s_services` - Get services
- `get_k8s_service` - Get specific service

### Job Management
- `get_k8s_jobs` - Get jobs
- `get_k8s_job` - Get specific job

### Secret Management
- `get_k8s_secrets` - Get secrets
- `get_k8s_secret` - Get specific secret

### ConfigMap Management
- `get_k8s_configmaps` - Get configmaps
- `get_k8s_configmap` - Get specific configmap

### Logs
- `get_k8s_pod_logs` - Get pod logs
- `stream_k8s_pod_logs` - Stream pod logs

### Port Forwarding
- `create_k8s_port_forward` - Create port forward
- `get_k8s_port_forwards` - Get port forwards
- `delete_k8s_port_forward` - Delete port forward

### Health and Info
- `check_k8s_cluster_health` - Check cluster health
- `get_k8s_cluster_info` - Get cluster info

### Resource Management
- `get_k8s_resource_quotas` - Get resource quotas
- `get_k8s_resource_usage` - Get resource usage

## Task Domain (Already Implemented)

The task domain commands are already implemented in the backend:
- `get_all_task_groups`
- `get_task_groups_by_resource`
- `add_task_group`
- `update_task_group`
- `delete_task_group`
- `link_task_group_to_resource`
- `unlink_task_group`
- `get_all_tasks`
- `get_tasks_by_group`
- `get_subtasks`
- `add_task`
- `update_task`
- `delete_task`
- `toggle_task_status`
- `move_task`
- `get_tasks_with_filters`
- `get_task_groups_with_filters`

## Implementation Priority

1. **High Priority** (Core functionality):
   - Projects domain commands
   - Settings domain commands
   - Process domain commands

2. **Medium Priority** (Enhanced functionality):
   - Frameworks domain commands
   - SDK domain commands
   - Automation domain commands

3. **Low Priority** (Advanced features):
   - Kubernetes domain commands (if not already implemented)
   - Advanced automation features

## Notes

- All commands should follow the existing pattern in `src-tauri/src/tasks/commands.rs`
- Use proper error handling and return `Result<T, String>` for all commands
- Implement database operations using the existing `DatabaseManager`
- Add proper validation and sanitization for all inputs
- Consider implementing caching for frequently accessed data
- Add proper logging for debugging and monitoring
