#!/bin/bash

# Automation script for logs-explorer
# This script helps with version management, git operations, and release preparation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[HEADER]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to get current version from package.json
get_package_version() {
    node -p "require('./package.json').version"
}

# Function to get current version from Cargo.toml
get_cargo_version() {
    grep '^version = ' src-tauri/Cargo.toml | cut -d'"' -f2
}

# Function to update version in package.json
update_package_version() {
    local version=$1
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = '$version';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    print_status "Updated package.json version to $version"
}

# Function to update version in Cargo.toml
update_cargo_version() {
    local version=$1
    sed -i "s/^version = \".*\"/version = \"$version\"/" src-tauri/Cargo.toml
    print_status "Updated Cargo.toml version to $version"
}

# Function to show current versions
show_versions() {
    local package_version=$(get_package_version)
    local cargo_version=$(get_cargo_version)
    
    echo -e "${BLUE}Current Versions:${NC}"
    echo -e "  package.json: ${GREEN}$package_version${NC}"
    echo -e "  Cargo.toml:   ${GREEN}$cargo_version${NC}"
    
    if [ "$package_version" != "$cargo_version" ]; then
        print_warning "Versions are out of sync!"
        return 1
    else
        print_status "Versions are in sync"
        return 0
    fi
}

# Function to sync versions
sync_versions() {
    local version=$1
    if [ -z "$version" ]; then
        print_error "Please provide a version number (e.g., 0.1.1)"
        exit 1
    fi
    
    print_status "Syncing versions to $version"
    update_package_version "$version"
    update_cargo_version "$version"
    print_status "Version sync complete"
}

# Function to bump version
bump_version() {
    local bump_type=$1
    local current_version=$(get_package_version)
    local new_version
    
    case $bump_type in
        patch)
            new_version=$(echo $current_version | awk -F. '{print $1"."$2"."$3+1}')
            ;;
        minor)
            new_version=$(echo $current_version | awk -F. '{print $1"."$2+1".0"}')
            ;;
        major)
            new_version=$(echo $current_version | awk -F. '{print $1+1".0.0"}')
            ;;
        *)
            print_error "Invalid bump type. Use: patch, minor, or major"
            exit 1
            ;;
    esac
    
    print_status "Bumping version from $current_version to $new_version"
    sync_versions "$new_version"
    echo "$new_version"
}

# Function to check git status
check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Working directory is not clean. Please commit or stash changes first."
        git status --short
        return 1
    fi
    return 0
}

# Function to check if we're on the right branch
check_branch() {
    local expected_branch=$1
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" != "$expected_branch" ]; then
        print_error "Expected to be on '$expected_branch' branch, but currently on '$current_branch'"
        return 1
    fi
    return 0
}

# Function to prepare release
prepare_release() {
    local bump_type=$1
    local commit_message=$2
    
    print_header "Preparing Release"
    
    # Check git status
    if ! check_git_status; then
        exit 1
    fi
    
    # Check if we're on main branch
    if ! check_branch "main"; then
        exit 1
    fi
    
    # Bump version
    local new_version=$(bump_version "$bump_type")
    
    # Create commit
    if [ -z "$commit_message" ]; then
        commit_message="chore: bump version to $new_version"
    fi
    
    print_status "Creating commit: $commit_message"
    git add package.json src-tauri/Cargo.toml
    git commit -m "$commit_message"
    
    # Create tag
    local tag_name="v$new_version"
    print_status "Creating tag: $tag_name"
    git tag "$tag_name"
    
    print_success "Release preparation complete!"
    print_status "New version: $new_version"
    print_status "Tag: $tag_name"
    print_warning "Don't forget to push: git push origin main --tags"
}

# Function to prepare beta release
prepare_beta() {
    local bump_type=$1
    local commit_message=$2
    
    print_header "Preparing Beta Release"
    
    # Check git status
    if ! check_git_status; then
        exit 1
    fi
    
    # Check if we're on develop branch
    if ! check_branch "develop"; then
        exit 1
    fi
    
    # Bump version
    local new_version=$(bump_version "$bump_type")
    
    # Create commit
    if [ -z "$commit_message" ]; then
        commit_message="chore: bump version to $new_version-beta"
    fi
    
    print_status "Creating commit: $commit_message"
    git add package.json src-tauri/Cargo.toml
    git commit -m "$commit_message"
    
    # Create tag
    local tag_name="v$new_version-beta"
    print_status "Creating tag: $tag_name"
    git tag "$tag_name"
    
    print_success "Beta release preparation complete!"
    print_status "New version: $new_version"
    print_status "Tag: $tag_name"
    print_warning "Don't forget to push: git push origin develop --tags"
}

# Function to push with version bump
push_with_bump() {
    local bump_type=$1
    local branch=$(git branch --show-current)
    
    print_header "Push with Version Bump"
    
    case $branch in
        main)
            print_status "Preparing production release on main branch..."
            prepare_release "$bump_type"
            print_status "Pushing to main branch with new version..."
            git push origin main --tags
            print_success "Pushed to main with version bump!"
            print_status "GitHub Actions will now build and create release v$(get_package_version)"
            ;;
        develop)
            print_status "Preparing beta release on develop branch..."
            prepare_beta "$bump_type"
            print_status "Pushing to develop branch with new version..."
            git push origin develop --tags
            print_success "Pushed to develop with version bump!"
            print_status "GitHub Actions will now build and create beta release v$(get_package_version)-beta"
            ;;
        *)
            print_error "This command only works on 'main' or 'develop' branches"
            print_error "Current branch: $branch"
            exit 1
            ;;
    esac
}

# Function to run tests
run_tests() {
    print_header "Running Tests"
    print_status "Installing dependencies..."
    pnpm install
    
    print_status "Running test suite..."
    pnpm test
    
    print_success "All tests passed!"
}

# Function to build application
build_app() {
    print_header "Building Application"
    print_status "Installing dependencies..."
    pnpm install
    
    print_status "Building Tauri application..."
    pnpm tauri build
    
    print_success "Build completed successfully!"
}

# Function to build Debian package
build_deb() {
    print_header "Building Debian Package"
    print_status "Installing dependencies..."
    pnpm install
    
    print_status "Building Tauri Debian package..."
    pnpm tauri build
    
    print_success "Debian package build completed successfully!"
    print_status "Check src-tauri/target/release/bundle/deb/ for the .deb file"
}

# Function to build and install Debian package
install_deb() {
    print_header "Building and Installing Debian Package"
    
    # Check if running as root for installation
    if [ "$EUID" -ne 0 ]; then
        print_warning "Installation requires root privileges. You may be prompted for your password."
    fi
    
    # Build the deb package first
    build_deb
    
    # Find the deb file
    local deb_dir="src-tauri/target/release/bundle/deb"
    local deb_file=$(find "$deb_dir" -name "*.deb" -type f | head -n 1)
    
    if [ -z "$deb_file" ]; then
        print_error "No .deb file found in $deb_dir"
        exit 1
    fi
    
    print_status "Found deb package: $deb_file"
    print_status "Installing package to system..."
    
    # Install the deb package
    print_status "Installing package with dpkg..."
    if command -v sudo >/dev/null 2>&1; then
        sudo dpkg -i "$deb_file"
    else
        dpkg -i "$deb_file"
    fi
    
    # Check if installation was successful
    if [ $? -eq 0 ]; then
        print_success "Package installed successfully!"
        print_status "You can now run 'logs-explorer' from the command line or find it in your applications menu."
    else
        print_warning "Package installation had issues, attempting to fix dependencies..."
        
        # Try to fix broken dependencies
        if command -v sudo >/dev/null 2>&1; then
            sudo apt-get install -f -y
        else
            apt-get install -f -y
        fi
        
        # Check again if installation is now successful
        if [ $? -eq 0 ]; then
            print_success "Package installed successfully after fixing dependencies!"
            print_status "You can now run 'logs-explorer' from the command line or find it in your applications menu."
        else
            print_error "Package installation failed even after fixing dependencies!"
            print_status "Please check the error messages above and try manual installation."
            exit 1
        fi
    fi
}

# Function to clean build artifacts
clean_build() {
    print_header "Cleaning Build Artifacts"
    
    print_status "Cleaning Node.js artifacts..."
    rm -rf node_modules
    rm -rf dist
    
    print_status "Cleaning Rust artifacts..."
    cd src-tauri
    cargo clean
    cd ..
    
    print_success "Build artifacts cleaned!"
}

# Function to show help
show_help() {
    echo -e "${CYAN}Kubernetes Logs Explorer Automation Script${NC}"
    echo ""
    echo "Usage: $0 {command} [options]"
    echo ""
    echo "Commands:"
    echo "  version:"
    echo "    show                    Show current versions"
    echo "    sync <version>          Sync both files to specified version"
    echo "    bump <patch|minor|major> Bump version by type"
    echo ""
    echo "  release:"
    echo "    prepare <type> [message] Prepare release (main branch only)"
    echo "    beta <type> [message]    Prepare beta release (develop branch only)"
    echo "    push <type>              Push with version bump (auto-detect branch)"
    echo ""
      echo "  development:"
  echo "    test                    Run test suite"
  echo "    build                   Build application"
  echo "    deb                     Build Debian package"
  echo "    install                 Build and install Debian package to system"
  echo "    clean                   Clean build artifacts"
    echo ""
    echo "Examples:"
    echo "  $0 version show"
    echo "  $0 version bump patch"
    echo "  $0 release prepare patch 'Fix critical bug'"
    echo "  $0 release beta minor 'Add new features'"
    echo "  $0 push patch"
    echo "  $0 test"
    echo "  $0 build"
    echo "  $0 install"
    echo ""
    echo "Version Types:"
    echo "  patch: 0.1.0 → 0.1.1 (bug fixes)"
    echo "  minor: 0.1.0 → 0.2.0 (new features)"
    echo "  major: 0.1.0 → 1.0.0 (breaking changes)"
}

# Main script logic
case "${1:-help}" in
    # Version management
    version)
        case "${2:-show}" in
            show)
                show_versions
                ;;
            sync)
                sync_versions "$3"
                ;;
            bump)
                bump_version "$3"
                ;;
            *)
                echo "Usage: $0 version {show|sync <version>|bump <patch|minor|major>}"
                exit 1
                ;;
        esac
        ;;
    
    # Release management
    release)
        case "${2:-help}" in
            prepare)
                prepare_release "$3" "$4"
                ;;
            beta)
                prepare_beta "$3" "$4"
                ;;
            push)
                push_with_bump "$3"
                ;;
            *)
                echo "Usage: $0 release {prepare|beta|push} <patch|minor|major> [message]"
                exit 1
                ;;
        esac
        ;;
    
    # Development commands
    test)
        run_tests
        ;;
    build)
        build_app
        ;;
    deb)
        build_deb
        ;;
    install)
        install_deb
        ;;
    clean)
        clean_build
        ;;
    
    # Help
    help|--help|-h)
        show_help
        ;;
    
    # Default
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
