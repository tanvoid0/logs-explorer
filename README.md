# Kubernetes Logs Explorer

A modern, cross-platform desktop application for exploring and managing Kubernetes clusters, built with Tauri, SvelteKit, and Rust.

![App Logo](static/tauri.svg)

## 📊 Status

[![Release Build](https://github.com/tanvoid0/logs-explorer/workflows/Build%20and%20Release/badge.svg?branch=main&event=push)](https://github.com/tanvoid0/logs-explorer/actions/workflows/release.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/tanvoid0/logs-explorer/releases)

### 📦 Latest Release
[![Current Version](https://img.shields.io/github/v/release/tanvoid0/logs-explorer?label=Current%20Version&color=blue)](https://github.com/tanvoid0/logs-explorer/releases/latest)

## 🚀 Features

- **Multi-Cluster Management**: Connect to multiple Kubernetes clusters
- **Real-time Logs**: Stream and search logs with advanced filtering
- **Resource Management**: View and manage pods, services, deployments, jobs
- **Jobs Management**: Group and manage Kubernetes Jobs by service labels
- **ConfigMaps & Secrets**: Secure management with tree editor
- **SDK Manager**: Detect and manage development tools
- **Integrated Terminal**: Project-aware command execution with timeout protection
- **Project Management**: Organize and manage development projects
- **Cross-Platform**: Windows, macOS, and Linux support

## 🔒 Security

### Implemented Security Measures
- **Input Validation**: Comprehensive path and command validation
- **SQL Injection Prevention**: Parameterized queries throughout
- **Command Injection Prevention**: Proper command argument handling
- **File System Security**: Path traversal prevention and system directory protection
- **Credential Security**: No hardcoded secrets, uses existing kubectl authentication
- **Process Management**: Timeout protection and process cleanup
- **Database Security**: SQLite with proper parameter binding

### Security Features
- **Namespace Enforcement**: Kubernetes namespace isolation
- **Resource Filtering**: Label-based resource access control
- **Secure Logging**: Sensitive data not logged
- **Error Handling**: Comprehensive error handling without information disclosure
- **Timeout Protection**: Automatic timeout for long-running commands

## 📦 Installation

### From Release Packages

1. **Download the latest release** from the [Releases page](https://github.com/tanvoid0/logs-explorer/releases)
2. **Choose your platform**:
   - **Windows**: Download `logs-explorer_x64.msi` or `logs-explorer_x64-setup.exe`
   - **macOS**: Download `logs-explorer_x64.dmg` (Intel) or `logs-explorer_aarch64.dmg` (Apple Silicon)
   - **Linux**: Download `logs-explorer_x64.AppImage` or `logs-explorer_x64.deb`

3. **Install the application**:
   - **Windows**: Run the `.msi` or `.exe` installer
   - **macOS**: Open the `.dmg` file and drag to Applications
   - **Linux**: 
     - **AppImage**: `chmod +x logs-explorer_x64.AppImage && ./logs-explorer_x64.AppImage`
     - **Debian**: `sudo dpkg -i logs-explorer_x64.deb`

### Prerequisites

- **Kubernetes Cluster**: Access to a Kubernetes cluster
- **kubectl**: Configured kubectl with proper kubeconfig
- **System Requirements**:
  - **Windows**: Windows 10 or later
  - **macOS**: macOS 10.15 or later
  - **Linux**: Ubuntu 18.04+, CentOS 7+, or similar

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **Rust** toolchain (latest stable)
- **Platform-specific dependencies** (see below)

### Platform Dependencies

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

#### macOS
```bash
xcode-select --install
```

#### Windows
```bash
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
```

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tanvoid0/logs-explorer.git
   cd logs-explorer
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   cd src-tauri && cargo build && cd ..
   ```

3. **Run in development mode**:
   ```bash
   pnpm tauri dev
   ```

### Development Commands

```bash
# Start development server
pnpm tauri dev

# Build for production
pnpm tauri build

# Run tests
pnpm test

# Type checking
pnpm check

# Format code
pnpm format

# Lint code
pnpm lint
```

## 🏗️ Architecture

### Technology Stack

- **Frontend**: SvelteKit 2.0 + TypeScript + Tailwind CSS
- **Backend**: Rust with Tauri 2.0
- **Kubernetes**: kube-rs library for Kubernetes API integration
- **Database**: SQLite for local configuration storage
- **Build System**: Vite + Tauri CLI
- **Package Manager**: pnpm

### Key Components

#### Frontend Architecture
- **State Management**: Svelte stores for reactive state
- **API Layer**: TypeScript wrapper for Rust Tauri commands
- **UI Components**: Modern, responsive design system
- **Real-time Features**: Live updates and streaming

#### Backend Architecture
- **Rust Modules**: Kubernetes API, database, process management
- **Security**: Input validation, command injection prevention
- **Performance**: Async operations, efficient resource handling
- **Error Handling**: Comprehensive error handling and recovery

### Data Flow

1. **User Interaction**: User interacts with SvelteKit frontend
2. **State Update**: Svelte stores update reactive state
3. **API Call**: Frontend calls Rust backend via Tauri commands
4. **Kubernetes API**: Rust backend communicates with Kubernetes cluster
5. **Response**: Data flows back through the chain to update UI

## 🔧 Configuration

### Kubernetes Setup

1. **Configure kubectl**:
   ```bash
   export KUBECONFIG=~/.kube/config
   kubectl cluster-info
   ```

2. **Verify permissions**:
   ```bash
   kubectl get namespaces
   kubectl get pods --all-namespaces
   ```

### Application Settings

The application stores settings in:
- **Linux**: `~/.config/logs-explorer/`
- **macOS**: `~/Library/Application Support/logs-explorer/`
- **Windows**: `%APPDATA%\logs-explorer\`

## 🚀 Deployment

### Building for Production

```bash
# Build for all platforms
pnpm tauri build

# Build for specific platform
pnpm tauri build --target x86_64-unknown-linux-gnu
pnpm tauri build --target x86_64-apple-darwin
pnpm tauri build --target x86_64-pc-windows-msvc
```

### CI/CD Pipeline

The project includes GitHub Actions workflows that:
- **Test**: Run tests on every push/PR
- **Build**: Build for all platforms on develop/main branches
- **Release**: Create releases automatically

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: Use strict TypeScript with proper types
- **Rust**: Follow Rust conventions and use clippy
- **Testing**: Add tests for new features
- **Documentation**: Update docs for API changes
- **Code Style**: Use Prettier and ESLint
- **Security**: Follow security best practices

## 📝 TODO

### High Priority
- [ ] GCP Cloud Logging integration
- [ ] Command palette implementation
- [ ] Real-time terminal output streaming
- [ ] Virtual scrolling for large datasets

### Medium Priority
- [ ] Advanced analytics and metrics
- [ ] Multi-cluster management
- [ ] Plugin system
- [ ] Performance optimization

### Low Priority
- [ ] Custom themes
- [ ] Export functionality
- [ ] Audit logging
- [ ] Enterprise features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team**: For the amazing cross-platform framework
- **Svelte Team**: For the reactive frontend framework
- **Kubernetes Community**: For the excellent kube-rs library
- **Contributors**: Everyone who has contributed to this project

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/tanvoid0/logs-explorer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tanvoid0/logs-explorer/discussions)
- **Documentation**: [Wiki](https://github.com/tanvoid0/logs-explorer/wiki)

---

**Note**: This project is actively developed. Please check the [releases page](https://github.com/tanvoid0/logs-explorer/releases) for the latest version and changelog.
