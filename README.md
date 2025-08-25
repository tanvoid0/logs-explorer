# Kubernetes Logs Explorer

A modern, cross-platform desktop application for exploring and managing Kubernetes clusters, built with Tauri, SvelteKit, and Rust.

![App Logo](static/tauri.svg)

## 📊 Status & Build Information

[![Release Build](https://github.com/tanvoid0/logs-explorer/workflows/Build%20and%20Release/badge.svg?branch=main&event=push)](https://github.com/tanvoid0/logs-explorer/actions/workflows/release.yml)
[![Beta Build](https://github.com/tanvoid0/logs-explorer/workflows/Build%20and%20Release/badge.svg?branch=develop&event=push)](https://github.com/tanvoid0/logs-explorer/actions/workflows/release.yml)
[![Tests](https://github.com/tanvoid0/logs-explorer/workflows/Build%20and%20Release/badge.svg?branch=main&event=pull_request)](https://github.com/tanvoid0/logs-explorer/actions/workflows/release.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/tanvoid0/logs-explorer/releases)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Rust](https://img.shields.io/badge/Rust-stable-orange.svg)](https://rust-lang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-Latest-purple.svg)](https://tauri.app/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-Latest-red.svg)](https://kit.svelte.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-Latest-yellow.svg)](https://pnpm.io/)

### 📦 Latest Release
[![Current Version](https://img.shields.io/github/v/release/tanvoid0/logs-explorer?label=Current%20Version&color=blue)](https://github.com/tanvoid0/logs-explorer/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/tanvoid0/logs-explorer)](https://github.com/tanvoid0/logs-explorer/releases/latest)
[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/tanvoid0/logs-explorer?include_prereleases&sort=semver)](https://github.com/tanvoid0/logs-explorer/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/tanvoid0/logs-explorer/latest/total)](https://github.com/tanvoid0/logs-explorer/releases/latest)

### 🔧 Development Status
[![Code Size](https://img.shields.io/github/languages/code-size/tanvoid0/logs-explorer)](https://github.com/tanvoid0/logs-explorer)
[![Repo Size](https://img.shields.io/github/repo-size/tanvoid0/logs-explorer)](https://github.com/tanvoid0/logs-explorer)
[![Issues](https://img.shields.io/github/issues/tanvoid0/logs-explorer)](https://github.com/tanvoid0/logs-explorer/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/tanvoid0/logs-explorer)](https://github.com/tanvoid0/logs-explorer/pulls)
[![Contributors](https://img.shields.io/github/contributors/tanvoid0/logs-explorer)](https://github.com/tanvoid0/logs-explorer/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/tanvoid0/logs-explorer/main)](https://github.com/tanvoid0/logs-explorer/commits/main)

### 📋 Badge Descriptions

- **Release Build**: Status of builds on the main branch (production releases)
- **Beta Build**: Status of builds on the develop branch (beta releases)
- **Tests**: Status of tests on pull requests
- **Platform**: Supported operating systems
- **Node.js/Rust/Tauri/SvelteKit/pnpm**: Technology stack versions
- **Current Version**: Latest stable version
- **GitHub Release**: Latest GitHub release version
- **Downloads**: Total downloads of the latest release
- **Code Size/Repo Size**: Repository statistics
- **Issues/PRs**: Open issues and pull requests
- **Contributors**: Number of contributors
- **Last Commit**: Most recent commit on main branch

## 🚀 Features

- **Multi-Cluster Management**: Connect to multiple Kubernetes clusters
- **Real-time Logs**: Stream and search logs from pods across namespaces with advanced filtering
- **Resource Management**: View and manage pods, services, deployments, and more
- **ConfigMaps & Secrets**: Secure management of configuration and secrets
- **Advanced Log Filtering**: Powerful search, severity filtering, and trace ID tracking
- **Unified Logs Viewer**: Consistent logs interface across workloads and pod details
- **Collapsible Log Entries**: Compact view with expandable details for better readability
- **Copy-to-Clipboard**: Easy copying of log messages, fields, and configurations
- **Dark/Light Theme**: Modern UI with theme support
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🔄 CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

### Workflow Jobs

1. **Test Job**: Runs on all branches and PRs
   - Installs dependencies (Node.js, Rust, system packages)
   - Runs test suite
   - Uses comprehensive caching for faster builds

2. **Build Jobs**: Run on main and develop branches
   - **Linux Build**: Creates AppImage and .deb packages
   - **macOS Build**: Creates .dmg packages (Intel + Apple Silicon)
   - **Windows Build**: Creates .msi and .exe installers

3. **Release Jobs**: Create GitHub releases
   - **Production Release**: Creates full release from main branch
   - **Beta Release**: Creates prerelease from develop branch

### Caching Strategy

- **pnpm Dependencies**: Caches `node_modules` and `~/.pnpm-store`
- **Rust Dependencies**: Caches `~/.cargo/registry`, `~/.cargo/git`, and `target`
- **System Dependencies**: Caches apt packages for faster installation

### Build Times

- **First Run**: ~10-15 minutes (no cache)
- **Subsequent Runs**: ~5-8 minutes (with caching)

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
     - **AppImage**: Make executable and run: `chmod +x logs-explorer_x64.AppImage && ./logs-explorer_x64.AppImage`
     - **Debian**: `sudo dpkg -i logs-explorer_x64.deb`

### Prerequisites

- **Kubernetes Cluster**: Access to a Kubernetes cluster
- **kubectl**: Configured kubectl with proper kubeconfig
- **System Requirements**:
  - **Windows**: Windows 10 or later
  - **macOS**: macOS 10.15 or later
  - **Linux**: Ubuntu 18.04+, CentOS 7+, or similar

## 🛠️ Development Setup

### Automation & Version Management

This project uses an automation script to manage versions, releases, and development workflows. The GitHub Actions workflow automatically uses the version from `package.json` for releases.

```bash
# Show current versions
./scripts/automation.sh version show

# Bump version (patch, minor, major)
./scripts/automation.sh version bump patch   # 0.1.0 → 0.1.1
./scripts/automation.sh version bump minor   # 0.1.0 → 0.2.0
./scripts/automation.sh version bump major   # 0.1.0 → 1.0.0

# Prepare and push release with version bump
./scripts/automation.sh push patch           # Auto-detect branch and push
./scripts/automation.sh release prepare patch 'Fix critical bug'
./scripts/automation.sh release beta minor 'Add new features'

# Development commands
./scripts/automation.sh test                 # Run test suite
./scripts/automation.sh build                # Build application
./scripts/automation.sh clean                # Clean build artifacts
```

#### Release Versioning

- **Production Releases**: Uses version from `package.json` (e.g., `v0.1.0`)
- **Beta Releases**: Uses version with `-beta` suffix (e.g., `v0.1.0-beta`)
- **Automatic Tagging**: GitHub Actions automatically creates Git tags matching the version
- **Release Names**: Automatically named "Kubernetes Logs Explorer vX.Y.Z" or "Kubernetes Logs Explorer vX.Y.Z Beta"

#### Automation Workflow

1. **Development**: Work on features in feature branches
2. **Beta Release**: 
   ```bash
   git checkout develop
   ./scripts/automation.sh push patch  # Bumps version, commits, tags, and pushes
   ```
3. **Production Release**:
   ```bash
   git checkout main
   ./scripts/automation.sh push minor  # Bumps version, commits, tags, and pushes
   ```

**Important**: The automation script increments the version **before** pushing, so GitHub Actions will use the new version for the release.

The automation script handles:
- ✅ Version bumping in both `package.json` and `Cargo.toml`
- ✅ Git commit creation with version changes
- ✅ Git tag creation matching the version
- ✅ Branch validation (main/develop only)
- ✅ Automatic pushing with tags
- ✅ GitHub Actions trigger for release creation with correct version

#### Complete Release Process

1. **Version Increment**: Automation script bumps version in both files
2. **Git Operations**: Creates commit and tag with new version
3. **Push**: Pushes changes and tags to trigger GitHub Actions
4. **Build**: GitHub Actions builds for all platforms (Linux, macOS, Windows)
5. **Release**: GitHub Actions creates release with correct version tag
6. **Artifacts**: Release includes all platform installers

**Example Flow**:
```bash
# Current version: 0.1.0
./scripts/automation.sh push patch
# → Bumps to 0.1.1, commits, tags as v0.1.1, pushes
# → GitHub Actions builds and creates release v0.1.1
```

**Important**: The workflow now triggers on tags, so releases are only created when tags are pushed, not on every push to main/develop.

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
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
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

2. **Install Node.js dependencies**:
   ```bash
   pnpm install
   ```

3. **Install Rust dependencies**:
   ```bash
   cd src-tauri
   cargo build
   cd ..
   ```

4. **Run in development mode**:
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

## 🏗️ Project Architecture

### Technology Stack

- **Frontend**: SvelteKit 2.0 + TypeScript + Tailwind CSS
- **Backend**: Rust with Tauri 2.0
- **Kubernetes**: kube-rs library for Kubernetes API integration
- **Build System**: Vite + Tauri CLI
- **Package Manager**: pnpm

### Project Structure

```
logs-explorer/
├── src/                          # Frontend source code
│   ├── app.html                  # Main HTML template
│   ├── app.css                   # Global styles
│   ├── lib/                      # Shared libraries
│   │   ├── api/                  # API clients
│   │   │   └── k8s.ts           # Kubernetes API wrapper
│   │   ├── components/           # Reusable UI components
│   │   ├── stores/               # Svelte stores (state management)
│   │   ├── services/             # Business logic services
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Utility functions
│   └── routes/                   # SvelteKit routes (pages)
│       ├── +layout.svelte        # Root layout
│       ├── +page.svelte          # Home page
│       ├── clusters/             # Cluster management
│       ├── workloads/            # Workload management
│       ├── logs/                 # Logs viewer
│       ├── analytics/            # Metrics and analytics
│       └── settings/             # Application settings
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs              # Application entry point
│   │   ├── lib.rs               # Library exports
│   │   └── k8s.rs               # Kubernetes API implementation
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
├── static/                       # Static assets
├── .github/                      # GitHub Actions workflows
└── package.json                  # Node.js dependencies
```

### Key Components

#### Frontend Architecture

**State Management**:
- **Svelte Stores**: Reactive state management using Svelte's built-in stores
- **App Store** (`stores/app-store.ts`): Global application state including namespace selection
- **Metrics Store** (`stores/metrics-store.ts`): Metrics data management
- **Toast Store** (`stores/toast-store.ts`): Toast notification management

**API Layer**:
- **Kubernetes API** (`api/k8s.ts`): TypeScript wrapper for Rust Tauri commands
- **Browser K8s Service** (`services/browser-k8s-service.ts`): Alternative browser-based implementation

**UI Components**:
- **LogsViewerContent**: Unified logs viewer with sidebar filters and main display area
- **LogsDisplay**: Main logs display component with view modes (detailed, compact, raw, lean)
- **LogEntry**: Individual log entry component with collapsible sections and copy functionality
- **AdvancedSearchPanel**: Advanced search interface (under development)
- **LogsSearchPanel**: Filter panel for deployments, pods, severity, and trace IDs
- **ResourceTables**: Data tables for Kubernetes resources
- **ConfigTreeEditor**: Hierarchical configuration editing

#### Backend Architecture

**Rust Modules**:
- **k8s.rs**: Kubernetes API integration using kube-rs
- **main.rs**: Tauri application setup and command registration
- **lib.rs**: Module exports and application lifecycle

**Key Features**:
- **Async Operations**: All Kubernetes operations are async
- **Error Handling**: Comprehensive error handling with anyhow
- **Resource Management**: Memory-efficient resource handling
- **Security**: Secure handling of secrets and sensitive data

### Data Flow

1. **User Interaction**: User interacts with SvelteKit frontend
2. **State Update**: Svelte stores update reactive state
3. **API Call**: Frontend calls Rust backend via Tauri commands
4. **Kubernetes API**: Rust backend communicates with Kubernetes cluster
5. **Response**: Data flows back through the chain to update UI

### Security Considerations

- **No Hardcoded Secrets**: All credentials come from user-provided kubeconfig
- **Secure Logging**: Sensitive data is not logged
- **File System Access**: Limited to user-selected kubeconfig files
- **Network Security**: Uses existing kubectl authentication

## 🔧 Configuration

### Kubernetes Setup

1. **Configure kubectl**:
   ```bash
   # Set your kubeconfig
   export KUBECONFIG=~/.kube/config
   
   # Test connection
   kubectl cluster-info
   ```

2. **Verify permissions**:
   ```bash
   # Check if you can list namespaces
   kubectl get namespaces
   
   # Check if you can list pods
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
  - **develop branch**: Creates pre-releases
  - **main branch**: Creates stable releases

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

## 📝 TODO

### High Priority
- [ ] Implement real metrics collection from Kubernetes metrics-server
- [ ] Add chart rendering with Chart.js or similar
- [ ] Implement kubeconfig file management
- [ ] Add pod exec/terminal functionality
- [ ] Implement deployment scaling and rollback
- [ ] Complete advanced search functionality in LogsViewerContent
- [ ] Add log aggregation and correlation features

### Medium Priority
- [ ] Add support for multiple kubeconfig contexts
- [ ] Add resource usage monitoring
- [ ] Implement backup and restore functionality
- [ ] Add plugin system for extensions
- [ ] Implement log export functionality
- [ ] Add custom log parsing rules

### Low Priority
- [ ] Add support for custom themes
- [ ] Implement keyboard shortcuts
- [ ] Add export functionality for logs and configs
- [ ] Implement audit logging
- [ ] Add support for custom resource definitions

## 🆕 Recent Updates

### Logs Viewer Improvements (Latest)
- **Unified Layout**: Consistent logs interface across workloads and pod details pages
- **Enhanced Log Display**: Collapsible log entries with "Show more/less" functionality
- **Copy Functionality**: Copy buttons for messages, fields, and entire log entries
- **Responsive Design**: Better text wrapping and overflow handling
- **Advanced Filtering**: Severity filters, trace ID tracking, and deployment filtering
- **Toast Notifications**: User feedback for copy operations and other actions
- **Compact View Modes**: Multiple view modes (detailed, compact, raw, lean) for different use cases

### UI/UX Enhancements
- **Consistent Navigation**: Navigation rail for settings and improved tab layouts
- **Better Responsiveness**: Improved mobile and desktop layouts
- **Enhanced Accessibility**: Better keyboard navigation and screen reader support

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
