use kube::Client;
use anyhow::Result;
use once_cell::sync::OnceCell;

// Kubernetes API client instance using thread-safe OnceCell
static K8S_CLIENT: OnceCell<Client> = OnceCell::new();

// Initialize Kubernetes client
pub async fn init_k8s_client() -> Result<()> {
    // If client is already initialized, return success
    if K8S_CLIENT.get().is_some() {
        return Ok(());
    }
    
    let client = Client::try_default().await?;
    K8S_CLIENT.set(client).map_err(|_| anyhow::anyhow!("K8S client already initialized"))?;
    Ok(())
}

// Get Kubernetes client
pub fn get_k8s_client() -> Result<Client> {
    K8S_CLIENT.get()
        .cloned()
        .ok_or_else(|| anyhow::anyhow!("Kubernetes client not initialized"))
}
