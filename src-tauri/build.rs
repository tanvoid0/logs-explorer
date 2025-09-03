

fn main() {
    // Simple build script - no migration handling to avoid infinite loops
    // Migrations are now managed manually in src/migrations/mod.rs
    
    // Build Tauri
    tauri_build::build()
}
