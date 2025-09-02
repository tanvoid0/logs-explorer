use crate::settings::entities::IdeConfigModel;
use crate::settings::repositories::IdeConfigRepository;
use crate::database::DatabaseManager;

/// Service for handling IDE settings business logic
pub struct IdeSettingsService {
    repository: IdeConfigRepository,
}

impl IdeSettingsService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        let repository = IdeConfigRepository::new(db_manager.get_connection_clone());
        Self { repository }
    }

    /// Get all IDE configs
    pub async fn get_all_ide_configs(&self) -> Result<Vec<IdeConfigModel>, sea_orm::DbErr> {
        self.repository.get_all().await
    }

    /// Get default IDE config
    pub async fn get_default_ide_config(&self) -> Result<Option<IdeConfigModel>, sea_orm::DbErr> {
        self.repository.get_default().await
    }

    /// Create a new IDE config
    pub async fn create_ide_config(
        &self,
        name: String,
        executable: String,
    ) -> Result<IdeConfigModel, sea_orm::DbErr> {
        self.repository.create(name, executable).await
    }

    /// Update an existing IDE config
    pub async fn update_ide_config(
        &self,
        id: i32,
        name: String,
        executable: String,
    ) -> Result<Option<IdeConfigModel>, sea_orm::DbErr> {
        self.repository.update(id, name, executable).await
    }

    /// Delete an IDE config
    pub async fn delete_ide_config(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        self.repository.delete(id).await
    }

    /// Set default IDE config
    pub async fn set_default_ide_config(&self, id: i32) -> Result<Option<IdeConfigModel>, sea_orm::DbErr> {
        self.repository.set_default(id).await
    }

    /// Open an IDE with the given executable
    pub async fn open_ide(&self, executable: &str) -> Result<(), String> {
        use std::process::Command;
        
        let result = if cfg!(target_os = "windows") {
            Command::new("cmd")
                .args(&["/C", "start", "", executable])
                .spawn()
        } else {
            Command::new(executable)
                .spawn()
        };
        
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to open IDE '{}': {}", executable, e))
        }
    }

    /// Detect installed IDEs on the system
    pub async fn detect_installed_ides(&self) -> Result<Vec<String>, String> {
        use std::process::Command;
        
        let common_ides = vec![
            "code",           // VS Code
            "idea",           // IntelliJ IDEA
            "webstorm",       // WebStorm
            "pycharm",        // PyCharm
            "goland",         // GoLand
            "clion",          // CLion
            "rider",          // Rider
            "phpstorm",       // PhpStorm
            "studio",         // Android Studio
            "subl",           // Sublime Text
            "vim",            // Vim
            "nvim",           // Neovim
            "emacs",          // Emacs
            "atom",           // Atom
            "brackets",       // Brackets
            "notepad++",      // Notepad++
            "gedit",          // Gedit
            "kate",           // Kate
            "mousepad",       // Mousepad
            "leafpad",        // Leafpad
        ];
        
        let mut installed_ides = Vec::new();
        
        for ide in common_ides {
            let result = if cfg!(target_os = "windows") {
                Command::new("where")
                    .arg(ide)
                    .output()
            } else {
                Command::new("which")
                    .arg(ide)
                    .output()
            };
            
            if let Ok(output) = result {
                if output.status.success() {
                    installed_ides.push(ide.to_string());
                }
            }
        }
        
        Ok(installed_ides)
    }
}
