# Changelog  
All notable changes to this project will be documented in this file.  
Adheres to [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

| Icon | Type              | Description |
|------|-------------------|-------------|
| ⚠️  | Breaking Changes | Backward-incompatible changes |
| ✨  | Added            | New features |
| ⚡  | Changed          | Existing feature optimizations/behavior changes |
| 🛠️  | Deprecated       | Features that will be removed in future versions |
| 🗑️  | Removed          | Deleted features |
| 🐛  | Fixed            | Bug fixes |

## [Unreleased]
### ✨ New Features

- Support for compiling CubeVisage Ore UI version in web browser
- Cloud update notification or version expiration reminder

## [1.5.0] - 2026-04-18  
### ✨ New Features
- Added automatic APK file signing

### ⚡ Changed
- Changed project icon
- Disabled always show scrollbar by default

### 🐛 Fixed
- Fixed JavaScript code syntax issue caused by force enabling scrollbar

## [1.4.0] - 2025-10-03  
### ⚠️ Breaking Changes  
- **Drop support for Node.js 16**. Minimum version now Node.js 20  

### ✨ Added
- Added automatic package version detection to match corresponding patching methods

### ⚡ Changed
- Optimized build performance (100% faster)

### 🐛 Fixed
- Fixed issue that could break JavaScript code syntax
- Fixed game routing layout switching issue on small screen devices or windows

## [1.3.1] - 2025-08-29  
### 🐛 Fixed  
- Fixed an issue where chat availability settings couldn't be modified
- Fixed a packaging issue in the build process

## [1.3.0] - 2025-08-28  
### ✨ Added  
- Added automated code deployment for CubeVisage UI Ore UI version
- Added browser debugging functionality
- Enabled compression