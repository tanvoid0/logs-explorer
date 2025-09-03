// Core modules
pub mod database;
pub mod migrations;

// Domain modules
pub mod tasks;
pub mod projects;
pub mod frameworks;
pub mod settings;
pub mod k8s;
pub mod documents;

// Infrastructure modules
pub mod process;
pub mod sdk;

// Common utilities
pub mod utils;

use tauri::Builder;
use tauri::generate_handler;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init());

    builder
        .setup(|app| {
            // Initialize database manager synchronously in setup
            let app_handle = app.handle().clone();
            
            // Use block_on to make the async initialization synchronous
            let db_manager = tauri::async_runtime::block_on(async {
                crate::database::DatabaseManager::new(&app_handle)
                    .await
                    .expect("Failed to initialize database manager")
            });
            
            // Manage the database manager immediately
            app_handle.manage(db_manager);
            Ok(())
        })
        .invoke_handler(generate_handler![
            // Task commands
            crate::tasks::commands::get_all_task_groups,
            crate::tasks::commands::get_task_groups_by_resource,
            crate::tasks::commands::add_task_group,
            crate::tasks::commands::update_task_group,
            crate::tasks::commands::delete_task_group,
            crate::tasks::commands::link_task_group_to_resource,
            crate::tasks::commands::unlink_task_group,
            crate::tasks::commands::get_all_tasks,
            crate::tasks::commands::get_tasks_by_group,
            crate::tasks::commands::get_subtasks,
            crate::tasks::commands::add_task,
            crate::tasks::commands::update_task,
            crate::tasks::commands::delete_task,
            crate::tasks::commands::delete_tasks_by_group,
            crate::tasks::commands::toggle_task_status,
            crate::tasks::commands::move_task,

            // Project commands
            crate::projects::commands::get_all_projects,
            crate::projects::commands::get_project,
            crate::projects::commands::add_project,
            crate::projects::commands::update_project,
            crate::projects::commands::delete_project,
            crate::projects::commands::toggle_project_star,
            crate::projects::commands::get_projects_with_filters,
            crate::projects::commands::get_frameworks,
            crate::projects::commands::validate_project_path,
            crate::projects::commands::generate_project_name,
            crate::projects::commands::detect_framework,
            crate::projects::commands::open_project_in_explorer,
            crate::projects::commands::select_directory,
            crate::projects::commands::open_project_with_framework_ide,
            crate::projects::commands::execute_command_in_directory,

            // Framework commands
            crate::frameworks::commands::get_all_frameworks,
            crate::frameworks::commands::get_active_frameworks,
            crate::frameworks::commands::get_framework,
            crate::frameworks::commands::get_framework_by_name,
            crate::frameworks::commands::create_framework,
            crate::frameworks::commands::update_framework,
            crate::frameworks::commands::delete_framework,
            crate::frameworks::commands::toggle_framework_active,
            crate::frameworks::commands::get_frameworks_by_category,
            crate::frameworks::commands::get_framework_categories,
            crate::frameworks::commands::search_frameworks,
            crate::frameworks::commands::get_all_framework_detections,
            crate::frameworks::commands::get_framework_detections_by_project_path,
            crate::frameworks::commands::get_framework_detections_by_framework,
            crate::frameworks::commands::create_framework_detection,
            crate::frameworks::commands::update_framework_detection,
            crate::frameworks::commands::delete_framework_detection,
            crate::frameworks::commands::get_detection_stats,
            crate::frameworks::commands::get_high_confidence_framework_detections,
            crate::frameworks::commands::get_recent_framework_detections,

            // Document commands
            crate::documents::commands::get_all_documents,
            crate::documents::commands::get_document,
            crate::documents::commands::get_document_by_uuid,
            crate::documents::commands::get_documents_by_project,
            crate::documents::commands::get_documents_by_deployment,
            crate::documents::commands::create_document,
            crate::documents::commands::update_draft,
            crate::documents::commands::save_document,
            crate::documents::commands::update_document_metadata,
            crate::documents::commands::delete_document,
            crate::documents::commands::search_documents,
            crate::documents::commands::get_document_stats,
            crate::documents::commands::open_document_in_new_window,

            // Kubernetes commands
            crate::k8s::commands::init_k8s,
            crate::k8s::commands::k8s_health_check,
            crate::k8s::commands::check_k8s_cluster_health,
            crate::k8s::commands::k8s_get_namespaces,
            crate::k8s::commands::k8s_get_pods,
            crate::k8s::commands::k8s_get_pod,
            crate::k8s::commands::k8s_delete_pod,
            crate::k8s::commands::k8s_get_pod_logs,
            crate::k8s::commands::k8s_get_pod_details,
            crate::k8s::commands::k8s_get_deployments,
            crate::k8s::commands::k8s_get_deployment,
            crate::k8s::commands::k8s_scale_deployment,
            crate::k8s::commands::k8s_delete_deployment,
            crate::k8s::commands::k8s_get_deployment_details,
            crate::k8s::commands::k8s_get_services,
            crate::k8s::commands::k8s_get_service,
            crate::k8s::commands::k8s_delete_service,
            crate::k8s::commands::k8s_get_service_details,
            crate::k8s::commands::k8s_get_logs,
            crate::k8s::commands::k8s_get_logs_from_pods,
            crate::k8s::commands::k8s_get_container_logs,
            crate::k8s::commands::k8s_get_config_maps,
            crate::k8s::commands::k8s_get_secrets,
            crate::k8s::commands::k8s_get_jobs,
            crate::k8s::commands::k8s_get_job_pods,

            // SDK commands
            crate::sdk::commands::detect_sdk_manager,
            crate::sdk::commands::execute_command,
            crate::sdk::commands::get_shell_info,

            // Settings commands
            crate::settings::commands::get_all_ide_settings,
            crate::settings::commands::get_ide_settings_by_framework,
            crate::settings::commands::get_default_ide_settings,
            crate::settings::commands::create_ide_settings,
            crate::settings::commands::update_ide_settings,
            crate::settings::commands::delete_ide_settings,
            crate::settings::commands::set_default_ide_settings,
            crate::settings::commands::open_project_with_ide_settings,
            crate::settings::commands::validate_ide_path,
            crate::settings::commands::detect_installed_ides,
            crate::settings::commands::get_all_app_settings,
            crate::settings::commands::get_app_settings_by_category,
            crate::settings::commands::get_app_setting,
            crate::settings::commands::create_app_settings,
            crate::settings::commands::update_app_settings,
            crate::settings::commands::delete_app_settings,
            crate::settings::commands::get_app_settings_categories,
            crate::settings::commands::export_settings,
            crate::settings::commands::import_settings,
            crate::settings::commands::reset_settings_to_default,

            // Process commands
            crate::process::commands::start_process,
            crate::process::commands::read_process_output,
            crate::process::commands::is_process_running,
            crate::process::commands::get_process_exit_code,
            crate::process::commands::kill_process,
            crate::process::commands::execute_command_live,
            crate::process::commands::cancel_command,
            crate::process::commands::cancel_process,
            crate::process::commands::cancel_all_processes,
            crate::process::commands::get_running_processes,

            // System utility commands
            crate::utils::get_user_home,

        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
