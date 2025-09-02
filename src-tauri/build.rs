use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Watch the migrations directory for changes, but exclude mod.rs to prevent infinite loops
    println!("cargo:rerun-if-changed=src/migrations");
    
    // Generate migration registry and get the list of migration files
    let migration_files = generate_migration_registry();
    
    // Also watch each migration file individually to ensure rebuilds when files are added/removed
    for migration_file in &migration_files {
        println!("cargo:rerun-if-changed=src/migrations/{}.rs", migration_file);
    }
    
    // Build Tauri
    tauri_build::build()
}

fn generate_migration_registry() -> Vec<String> {
    let migrations_dir = Path::new("src/migrations");
    let out_dir = env::var("OUT_DIR").expect("OUT_DIR environment variable not set");
    let dest_path = Path::new(&out_dir).join("migration_registry.rs");
    
    if !migrations_dir.exists() {
        // Create empty registry if migrations directory doesn't exist
        fs::write(&dest_path, "pub fn get_migrations() -> Vec<Box<dyn sea_orm_migration::MigrationTrait>> { vec![] }")
            .expect("Failed to write empty migration registry");
        return Vec::new();
    }
    
    let mut migration_files = Vec::new();
    
    // Read all .rs files in the migrations directory
    if let Ok(entries) = fs::read_dir(migrations_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() && path.extension().map_or(false, |ext| ext == "rs") {
                    if let Some(file_name) = path.file_stem() {
                        if let Some(name) = file_name.to_str() {
                            // Skip mod.rs
                            if name != "mod" {
                                migration_files.push(name.to_string());
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Sort migrations by name (which includes timestamp)
    migration_files.sort();
    
    // Generate the registry code
    let mut registry_code = String::new();
    registry_code.push_str("use sea_orm_migration::MigrationTrait;\n");
    registry_code.push_str("use std::collections::HashMap;\n\n");
    
    // Add imports for each migration
    for migration in &migration_files {
        registry_code.push_str(&format!("use crate::migrations::{}::Migration;\n", migration));
    }
    
    registry_code.push_str("\npub fn get_migrations() -> Vec<Box<dyn MigrationTrait>> {\n");
    registry_code.push_str("    let mut migrations: HashMap<String, Box<dyn MigrationTrait>> = HashMap::new();\n\n");
    
    // Add each migration to the registry
    for migration in &migration_files {
        registry_code.push_str(&format!("    migrations.insert(\n"));
        registry_code.push_str(&format!("        \"{}\".to_string(),\n", migration));
        registry_code.push_str(&format!("        Box::new(Migration)\n"));
        registry_code.push_str(&format!("    );\n\n"));
    }
    
    registry_code.push_str("    // Sort by migration name and return in order\n");
    registry_code.push_str("    let mut sorted_names: Vec<String> = migrations.keys().cloned().collect();\n");
    registry_code.push_str("    sorted_names.sort();\n\n");
    registry_code.push_str("    sorted_names.into_iter()\n");
    registry_code.push_str("        .map(|name| migrations.remove(&name).expect(\"Migration not found in registry\"))\n");
    registry_code.push_str("        .collect()\n");
    registry_code.push_str("}\n");
    
    // Write the generated registry
    fs::write(&dest_path, registry_code).expect("Failed to write migration registry");
    
    // Also update the mod.rs file to include all migrations
    update_mod_rs(&migration_files);
    
    // Return the migration files list
    migration_files
}

fn update_mod_rs(migration_files: &[String]) {
    let mod_rs_path = Path::new("src/migrations/mod.rs");
    let mut mod_rs_content = String::new();
    
    // Add module declarations
    for migration in migration_files {
        mod_rs_content.push_str(&format!("pub mod {};\n", migration));
    }
    
    mod_rs_content.push_str("\n// Re-export all migrations for easy access\n");
    for migration in migration_files {
        // Generate a proper identifier that doesn't start with a number
        // Handle any datetime format by extracting the descriptive part
        let struct_name = generate_safe_identifier(migration);
        mod_rs_content.push_str(&format!("pub use {}::Migration as {};\n", migration, struct_name));
    }
    
    // Only write if content has changed to prevent unnecessary rebuilds
    if let Ok(existing_content) = fs::read_to_string(mod_rs_path) {
        if existing_content == mod_rs_content {
            return; // Content hasn't changed, don't write
        }
    }
    
    // Write the updated mod.rs
    fs::write(mod_rs_path, mod_rs_content).expect("Failed to write mod.rs file");
}

/// Generate a safe Rust identifier from a migration filename
/// Handles any datetime format and converts to a valid identifier
fn generate_safe_identifier(migration_name: &str) -> String {
    // Remove common datetime prefixes (mYYYYMMDD_HHMMSS_ or similar patterns)
    let cleaned = if migration_name.starts_with('m') {
        // Find the first underscore after the datetime part
        if let Some(first_underscore) = migration_name.find('_') {
            if let Some(second_underscore) = migration_name[first_underscore + 1..].find('_') {
                // Skip the datetime part (mYYYYMMDD_HHMMSS_)
                &migration_name[first_underscore + second_underscore + 2..]
            } else {
                // Only one underscore, skip the datetime part
                &migration_name[first_underscore + 1..]
            }
        } else {
            // No underscores, just remove the 'm' prefix
            &migration_name[1..]
        }
    } else {
        migration_name
    };
    
    // Convert to a safe identifier
    // Replace underscores with camelCase and ensure it doesn't start with a number
    let mut result = String::new();
    let mut capitalize_next = false;
    
    for ch in cleaned.chars() {
        if ch == '_' {
            capitalize_next = true;
        } else if ch.is_alphanumeric() {
            if result.is_empty() && ch.is_numeric() {
                // If it would start with a number, add a prefix
                result.push_str("migration_");
            }
            
            if capitalize_next {
                result.push(ch.to_ascii_uppercase());
                capitalize_next = false;
            } else {
                result.push(ch);
            }
        }
    }
    
    // If the result is empty or starts with a number, add a prefix
    if result.is_empty() || result.chars().next().map_or(false, |c| c.is_numeric()) {
        format!("migration_{}", result)
    } else {
        result
    }
}
