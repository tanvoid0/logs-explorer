#!/bin/bash

# Version management script for logs-explorer
# This script helps sync versions between package.json and Cargo.toml

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
}

# Main script logic
case "${1:-show}" in
    show)
        show_versions
        ;;
    sync)
        sync_versions "$2"
        ;;
    bump)
        bump_version "$2"
        ;;
    *)
        echo "Usage: $0 {show|sync <version>|bump <patch|minor|major>}"
        echo ""
        echo "Commands:"
        echo "  show                    Show current versions"
        echo "  sync <version>          Sync both files to specified version"
        echo "  bump <patch|minor|major> Bump version by type"
        echo ""
        echo "Examples:"
        echo "  $0 show"
        echo "  $0 sync 0.1.1"
        echo "  $0 bump patch"
        echo "  $0 bump minor"
        echo "  $0 bump major"
        exit 1
        ;;
esac
