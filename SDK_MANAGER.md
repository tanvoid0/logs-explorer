# SDK Manager

A comprehensive SDK management tool integrated into the Logs Explorer application that helps developers manage their development tools and SDKs across different platforms and package managers.

## Features

### 🔍 **SDK Detection**
- Automatically detects installed SDKs on your system
- Identifies which package manager is managing each SDK
- Shows version information and installation paths
- Categorizes SDKs by type (Language, Runtime, Tool)

### 🛠️ **SDK Manager Support**
The SDK Manager supports the following package managers:

#### Language-Specific Managers
- **SDKMAN** - Java, Kotlin, Scala, Groovy, Gradle, Maven, SBT
- **NVM** - Node.js versions
- **Pyenv** - Python versions
- **RVM/RBenv** - Ruby versions
- **GVM** - Go versions
- **Rustup** - Rust toolchains
- **ASDF** - Multi-language version manager

#### Node.js Managers
- **Volta** - JavaScript tool manager
- **FNM** - Fast Node Manager
- **N** - Node version manager

#### Python Managers
- **Conda** - Package and environment manager
- **Mamba** - Fast conda alternative
- **Pipenv** - Python dependency manager
- **Poetry** - Python packaging and dependency management

#### System Package Managers
- **Homebrew** - macOS package manager
- **APT** - Debian/Ubuntu package manager
- **YUM** - Red Hat package manager
- **DNF** - Fedora package manager
- **Pacman** - Arch Linux package manager

### 📦 **SDK Operations**
- **Install** - Install new SDK versions
- **Switch** - Switch between installed versions
- **Uninstall** - Remove SDK versions
- **List** - View available and installed versions
- **Update** - Update SDK managers and SDKs

### 🎯 **Supported SDKs**
The SDK Manager can detect and manage:

#### Languages
- Python, Rust, Go, Java, Ruby, PHP, Dart
- Kotlin, Scala, Elixir, Erlang, Haskell, OCaml
- Clojure, Groovy

#### Runtimes
- Node.js, .NET, Flutter

#### Tools
- Maven, Gradle, SBT, Cargo
- npm, Yarn, pnpm, pip, Poetry, Conda
- System package managers (brew, apt, yum, dnf, pacman)

## Usage

### Accessing the SDK Manager

1. **Navigation**: Click on "SDK Manager" in the sidebar navigation
2. **Overview**: View a summary of available managers and installed SDKs
3. **Tabs**: Use the different tabs to explore specific aspects:
   - **Overview**: Quick summary and recent activity
   - **Managers**: Detailed view of all SDK managers
   - **SDKs**: Categorized view of installed SDKs
   - **Operations**: History of SDK management operations

### Installing an SDK

1. Navigate to the **SDKs** tab
2. Find the SDK you want to install
3. Click the **"Install Version"** button
4. Enter the version (or leave empty for latest)
5. Click **Install**

### Switching SDK Versions

1. Go to the **SDKs** tab
2. Find the SDK with multiple versions
3. Click **"Switch Version"** next to the desired version
4. Confirm the switch

### Managing SDK Managers

1. Navigate to the **Managers** tab
2. View all available and unavailable SDK managers
3. Click **"Docs"** to open documentation for a manager
4. See which SDKs each manager supports

## Technical Details

### Architecture

The SDK Manager consists of several components:

#### Frontend Components
- `SDKManager.svelte` - Main SDK Manager interface
- `SDKManagerCard.svelte` - Compact card for overview pages
- `sdk-store.ts` - Svelte store for state management

#### Backend Services
- `sdk-manager.ts` - Core SDK management service
- `execute_command` - Tauri command for shell execution

#### Type Definitions
- `sdk.ts` - TypeScript interfaces and types

### How It Works

1. **Detection**: The service runs shell commands to detect installed SDKs and managers
2. **Classification**: SDKs are categorized by type and associated with their managers
3. **Operations**: Commands are built dynamically based on the detected manager
4. **Execution**: Shell commands are executed through Tauri's secure command execution
5. **Feedback**: Results are displayed in real-time with operation history

### Security Considerations

- All shell commands are executed through Tauri's secure command execution
- Commands are validated and sanitized before execution
- User confirmation is required for destructive operations
- Operation history is maintained for audit purposes

## Configuration

### Environment Variables

The SDK Manager respects standard environment variables:
- `PATH` - For finding executables
- `HOME` - For user-specific configurations
- Manager-specific variables (e.g., `SDKMAN_DIR`, `NVM_DIR`)

### Manager-Specific Configuration

Each SDK manager may have its own configuration files:
- **SDKMAN**: `~/.sdkman/etc/config`
- **NVM**: `~/.nvm/nvm.sh`
- **Pyenv**: `~/.pyenv/version`
- **ASDF**: `~/.tool-versions`

## Troubleshooting

### Common Issues

1. **Manager Not Detected**
   - Ensure the manager is properly installed and in your PATH
   - Check if the manager's initialization script is loaded
   - Verify the manager's version command works in terminal

2. **SDK Not Found**
   - Check if the SDK is actually installed
   - Verify the SDK's executable is in your PATH
   - Try refreshing the SDK list

3. **Permission Errors**
   - Some operations may require sudo privileges
   - Check file permissions for SDK directories
   - Ensure you have write access to the installation directory

4. **Version Parsing Issues**
   - Different managers output versions in different formats
   - The parser handles common formats but may need updates for edge cases
   - Check the operation output for raw command results

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages and operation logs.

## Contributing

To add support for new SDK managers or SDKs:

1. **Add Manager Detection**: Update the `detectSDKManagers()` method
2. **Add SDK Detection**: Update the `detectInstalledSDKs()` method
3. **Add Command Builders**: Implement command building methods
4. **Add Version Parsing**: Update the `parseVersions()` method
5. **Add Icons**: Update the icon mapping functions
6. **Test**: Verify the new manager/SDK works correctly

## Future Enhancements

- **GUI for Manager Installation**: Help users install missing SDK managers
- **Version Recommendations**: Suggest optimal versions based on project requirements
- **Project Integration**: Auto-detect SDK requirements from project files
- **Batch Operations**: Install/update multiple SDKs at once
- **Cloud SDK Support**: Integration with cloud SDKs (AWS CLI, Azure CLI, etc.)
- **Docker Integration**: Manage SDKs in Docker containers
- **Performance Optimization**: Cache detection results and optimize command execution
