<div align="left">
  <img src="https://raw.githubusercontent.com/wisebreeze/cubevisage-ui-for-ore-ui/main/src/sources/pack_icon.png" width="150" alt="CubeVisage Icon">
</div>

# CubeVisage UI Ore UI Edition

[![GitHub release](https://img.shields.io/github/v/release/wisebreeze/cubevisage-ui-for-ore-ui?style=flat-square)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/releases)
[![GitHub stars](https://img.shields.io/github/stars/wisebreeze/cubevisage-ui-for-ore-ui?style=flat-square)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/stargazers)
[![License](https://img.shields.io/badge/license-Custom-green?style=flat-square)](LICENSE)
[![Build Workflow](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml/badge.svg)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml)

[English](/README.md) / [简体中文](/README.zh_CN.md) / [繁體中文](/README.zh_TW.md)

CubeVisage UI Ore UI Edition is a user interface built on top of Ore UI.

* **Simple:** CubeVisage UI makes improving the user experience effortless. No coding background is required to enhance the Ore-UI experience.
* **Multi-platform:** CubeVisage UI supports multiple platforms, delivering an immersive experience for users.

## Deployment

1. Fork this repository.
2. Upload the original game packages (APK / IPA / APPX) to the root of the `src/` folder.
3. Go to [Actions → Build & Release → Run workflow](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml) and trigger the workflow manually.
4. Wait about 40 seconds, then download the signed packages from the [Releases](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/releases) page.
5. Sign the packages if necessary.
6. Install.

## Auto-Deploy

Create a repository variable:

| Variable      | Value |
|---------------|-------|
| `AUTO_DEPLOY` | `true`|

The workflow will automatically trigger whenever files inside the `src/` directory change.

## Local Deployment

We also provide a local deployment option for CubeVisage UI Ore UI Edition.

Before proceeding, ensure **Node.js ≥ 20** is installed.  
Check your Node.js version with `node -v`.

1. Download the repository code.
2. Extract the archive.
3. Open a terminal and navigate to the extracted folder.
4. Run `npm start`.
5. After approximately 40 seconds, find the output in the `dist/` folder at the project root.
6. Sign the packages if necessary.
7. Install.

## Browser Debugging

We provide online debugging for CubeVisage UI to quickly preview changes.  
Before proceeding, please check if Node.js is installed on your terminal and ensure the Node.js version is ≥ 20.  
Enter node -v in your terminal to verify if the Node.js version is ≥ 20.  

Before debugging, copy the .lang files from resource_packs/oreui/texts to the src/texts folder,  
and copy the .lang files from gui/dist/hbui/ to the src/texts folder. The file structure is as follows:  

```text
cubevisage-ui-for-ore-ui/
├── package.json
├── dist/ # Output directory
│   └── xxx.apk
└── src/
     ├── texts/ # Translation files
     └── xxx.apk # Any installation package
```

1. Download the repository code.
2. Extract the archive.
3. Open a terminal and navigate to the extracted folder.
4. Run `npm run dev`.
5. Visit [0.0.0.0:8800](http://0.0.0.0:8800) in your browser.

To exit hot-reload, press `q` then Enter in the terminal.

## Update Fork & Sync with Upstream

```bash
git remote add upstream https://github.com/wisebreeze/cubevisage-ui-for-ore-ui.git
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Configuration

Before running the workflow, edit the `config.json` file in the project root to customize the build.

## Contributing

This repository aims to continue developing the CubeVisage ecosystem and improve the user experience.

We appreciate community contributions for bug fixes and enhancements.

### Code of Conduct

- Do not add malicious code.  
- Do not violate the license terms below.

### Contribution Guide

Please open an [issue](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/issues) with screenshots and detailed descriptions to help us improve CubeVisage UI.

## License

- Modification of the code is permitted.  
- Original author attribution must be retained.  
- Commercial use is strictly prohibited.  
- This repository is not affiliated with any company or studio.  
- All referenced works are used solely for identification purposes.  
- The original author retains all rights.