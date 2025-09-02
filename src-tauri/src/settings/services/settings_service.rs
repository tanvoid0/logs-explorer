use sea_orm::*;
// Removed unused import: use sea_orm::prelude::Expr;
use crate::database::DatabaseManager;
use crate::settings::entities::{
    IDESettingsEntity, IDESettingsModel, IDESettingsActiveModel,
    AppSettingsEntity, AppSettingsModel, AppSettingsActiveModel
};
use std::path::Path;
use std::process::Command;

pub struct SettingsService {
    db_manager: DatabaseManager,
}

impl SettingsService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        Self {
            db_manager: db_manager.clone(),
        }
    }

    // IDE Settings Management
    pub async fn get_all_ide_settings(&self) -> Result<Vec<IDESettingsModel>, DbErr> {
        let db = self.db_manager.get_connection();
        IDESettingsEntity::find()
            .all(db)
            .await
    }

    pub async fn get_ide_settings_by_framework(&self, _framework: &str) -> Result<Vec<IDESettingsModel>, DbErr> {
        let db = self.db_manager.get_connection();
        // For now, return all IDE settings since we don't have framework mapping yet
        IDESettingsEntity::find()
            .all(db)
            .await
    }

    pub async fn get_default_ide_settings(&self, _framework: &str) -> Result<Option<IDESettingsModel>, DbErr> {
        let db = self.db_manager.get_connection();
        // Use a simple query without column references to avoid ambiguity
        let settings = IDESettingsEntity::find()
            .all(db)
            .await?;
        
        Ok(settings.into_iter().find(|s| s.is_default))
    }

    pub async fn create_ide_settings(
        &self,
        name: String,
        executable: String,
        _framework: String,
        is_default: bool,
    ) -> Result<IDESettingsModel, DbErr> {
        let db = self.db_manager.get_connection();
        
        let ide_settings = IDESettingsActiveModel {
            name: Set(name),
            executable: Set(executable),
            is_default: Set(is_default),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        ide_settings.insert(db).await
    }

    pub async fn update_ide_settings(
        &self,
        id: i32,
        name: Option<String>,
        executable: Option<String>,
        _framework: Option<String>,
        is_default: Option<bool>,
    ) -> Result<Option<IDESettingsModel>, DbErr> {
        let db = self.db_manager.get_connection();
        
        let ide_settings = IDESettingsEntity::find_by_id(id)
            .one(db)
            .await?;

        if let Some(ide_settings_model) = ide_settings {
            let mut ide_settings_active: IDESettingsActiveModel = ide_settings_model.into();
            
            if let Some(name) = name {
                ide_settings_active.name = Set(name);
            }
            if let Some(executable) = executable {
                ide_settings_active.executable = Set(executable);
            }
            if let Some(is_default) = is_default {
                ide_settings_active.is_default = Set(is_default);
            }
            
            ide_settings_active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
            
            let updated_settings = ide_settings_active.update(db).await?;
            Ok(Some(updated_settings))
        } else {
            Ok(None)
        }
    }

    pub async fn delete_ide_settings(&self, id: i32) -> Result<bool, DbErr> {
        let db = self.db_manager.get_connection();
        let result = IDESettingsEntity::delete_by_id(id)
            .exec(db)
            .await?;
        Ok(result.rows_affected > 0)
    }

    pub async fn set_default_ide_settings(&self, id: i32) -> Result<IDESettingsModel, DbErr> {
        let db = self.db_manager.get_connection();
        
        // First, unset all defaults by updating all records
        let all_settings = IDESettingsEntity::find().all(db).await?;
        for setting in all_settings {
            let mut active_model: IDESettingsActiveModel = setting.into();
            active_model.is_default = Set(false);
            active_model.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
            active_model.update(db).await?;
        }

        // Then set the specified one as default
        let ide_settings = IDESettingsEntity::find_by_id(id)
            .one(db)
            .await?;

        if let Some(ide_settings_model) = ide_settings {
            let mut ide_settings_active: IDESettingsActiveModel = ide_settings_model.into();
            ide_settings_active.is_default = Set(true);
            ide_settings_active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
            
            ide_settings_active.update(db).await
        } else {
            Err(DbErr::RecordNotFound("IDE settings not found".to_string()))
        }
    }

    // App Settings Management
    pub async fn get_all_app_settings(&self) -> Result<Vec<AppSettingsModel>, DbErr> {
        let db = self.db_manager.get_connection();
        AppSettingsEntity::find()
            .all(db)
            .await
    }

    pub async fn get_app_settings_by_category(&self, category: &str) -> Result<Vec<AppSettingsModel>, DbErr> {
        let db = self.db_manager.get_connection();
        let all_settings = AppSettingsEntity::find().all(db).await?;
        Ok(all_settings.into_iter().filter(|s| s.category == category).collect())
    }

    pub async fn get_app_setting(&self, key: &str) -> Result<Option<AppSettingsModel>, DbErr> {
        let db = self.db_manager.get_connection();
        let all_settings = AppSettingsEntity::find().all(db).await?;
        Ok(all_settings.into_iter().find(|s| s.key == key))
    }

    pub async fn create_app_settings(
        &self,
        key: String,
        value: String,
        category: String,
        description: Option<String>,
    ) -> Result<AppSettingsModel, DbErr> {
        let db = self.db_manager.get_connection();
        
        let app_settings = AppSettingsActiveModel {
            key: Set(key),
            value: Set(value),
            category: Set(category),
            description: Set(description),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        app_settings.insert(db).await
    }

    pub async fn update_app_settings(
        &self,
        key: &str,
        value: Option<String>,
        category: Option<String>,
        description: Option<String>,
    ) -> Result<Option<AppSettingsModel>, DbErr> {
        let db = self.db_manager.get_connection();
        
        let app_settings = AppSettingsEntity::find().all(db).await?;
        let target_setting = app_settings.into_iter().find(|s| s.key == key);

        if let Some(app_settings_model) = target_setting {
            let mut app_settings_active: AppSettingsActiveModel = app_settings_model.into();
            
            if let Some(value) = value {
                app_settings_active.value = Set(value);
            }
            if let Some(category) = category {
                app_settings_active.category = Set(category);
            }
            if let Some(description) = description {
                app_settings_active.description = Set(Some(description));
            }
            
            app_settings_active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
            
            let updated_settings = app_settings_active.update(db).await?;
            Ok(Some(updated_settings))
        } else {
            Ok(None)
        }
    }

    pub async fn delete_app_settings(&self, key: &str) -> Result<bool, DbErr> {
        let db = self.db_manager.get_connection();
        let all_settings = AppSettingsEntity::find().all(db).await?;
        let target_setting = all_settings.into_iter().find(|s| s.key == key);
        
        if let Some(setting) = target_setting {
            let result = AppSettingsEntity::delete_by_id(setting.id)
                .exec(db)
                .await?;
            Ok(result.rows_affected > 0)
        } else {
            Ok(false)
        }
    }

    pub async fn get_app_settings_categories(&self) -> Result<Vec<String>, DbErr> {
        let db = self.db_manager.get_connection();
        let all_settings = AppSettingsEntity::find().all(db).await?;
        let mut categories = all_settings.into_iter()
            .map(|s| s.category)
            .collect::<Vec<_>>();
        categories.sort();
        categories.dedup();
        Ok(categories)
    }

    // Utility methods
    pub async fn validate_ide_path(&self, path: &str) -> Result<bool, DbErr> {
        let path_obj = Path::new(path);
        if !path_obj.exists() {
            return Ok(false);
        }

        // Check if it's executable
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Ok(metadata) = std::fs::metadata(path) {
                let permissions = metadata.permissions();
                return Ok(permissions.mode() & 0o111 != 0);
            }
        }

        #[cfg(windows)]
        {
            // On Windows, check if it's a .exe file or has executable extension
            if let Some(extension) = path_obj.extension() {
                return Ok(extension == "exe" || extension == "bat" || extension == "cmd");
            }
        }

        Ok(false)
    }

    pub async fn detect_installed_ides(&self) -> Result<Vec<String>, DbErr> {
        let mut detected_ides = Vec::new();

        // Common IDE paths
        let ide_paths = [
            ("VS Code", "code"),
            ("Visual Studio", "devenv"),
            ("IntelliJ IDEA", "idea"),
            ("Android Studio", "studio"),
            ("Eclipse", "eclipse"),
            ("Sublime Text", "subl"),
            ("Atom", "atom"),
            ("Vim", "vim"),
            ("Emacs", "emacs"),
            ("Neovim", "nvim"),
        ];

        for (name, command) in ide_paths.iter() {
            if let Ok(output) = Command::new("which").arg(command).output() {
                if output.status.success() {
                    detected_ides.push((*name).to_string());
                }
            }
        }

        Ok(detected_ides)
    }

    pub async fn open_project_with_framework_ide(&self, project_path: &str, _framework: &str) -> Result<(), DbErr> {
        let db = self.db_manager.get_connection();
        
        // Get default IDE
        let all_settings = IDESettingsEntity::find().all(db).await?;
        let default_ide = all_settings.into_iter().find(|s| s.is_default);

        if let Some(ide_settings_model) = default_ide {
            let executable = ide_settings_model.executable;
            
            // Open the project with the IDE
            let status = Command::new(&executable)
                .arg(project_path)
                .status()
                .map_err(|e| DbErr::Custom(format!("Failed to open project: {}", e)))?;

            if !status.success() {
                return Err(DbErr::Custom("Failed to open project with IDE".to_string()));
            }
        } else {
            return Err(DbErr::Custom("No default IDE configured".to_string()));
        }

        Ok(())
    }
}
