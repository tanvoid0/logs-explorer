mod k8s;

// Kubernetes API commands

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            k8s::init_k8s,
            k8s::k8s_health_check,
            k8s::k8s_get_namespaces,
            k8s::k8s_get_pods,
            k8s::k8s_get_services,
            k8s::k8s_get_deployments,
            k8s::k8s_get_configmaps,
            k8s::k8s_get_secrets,
            k8s::k8s_get_logs,
            k8s::k8s_get_namespace_logs,
            k8s::k8s_get_pod_containers,
            k8s::k8s_delete_pod,
            k8s::k8s_restart_pod,
            k8s::k8s_scale_deployment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
