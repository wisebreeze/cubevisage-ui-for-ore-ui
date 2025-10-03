<div align="left">
  <img src="https://raw.githubusercontent.com/wisebreeze/cubevisage-ui-for-ore-ui/main/src/sources/pack_icon.png" width="150" alt="CubeVisage Icon">
</div>

# 立方之窗 UI Ore UI 版本

[![GitHub release](https://img.shields.io/github/v/release/wisebreeze/cubevisage-ui-for-ore-ui?style=flat-square)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/releases)
[![GitHub stars](https://img.shields.io/github/stars/wisebreeze/cubevisage-ui-for-ore-ui?style=flat-square)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/stargazers)
[![授權證](https://img.shields.io/badge/授權證-自訂-green?style=flat-square)](LICENSE)
[![(工作流) 建構](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml/badge.svg)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml)

[English](/README.md) / [简体中文](/README.zh-CN.md) / [繁體中文](/README.zh-TW.md)

立方之窗 UI Ore UI 版本是基於 Ore UI 開發的使用者介面。

* **簡單：** 立方之窗 UI 讓改善使用者體驗變得簡單。無需程式碼基礎，即可強化 Ore UI 的體驗。  
* **多平台部署：** 立方之窗 UI 適用於多平台，為使用者帶來沉浸式體驗。

## 部署

1. Fork 本儲存庫。  
2. 將原始遊戲安裝包上傳至 `src/` 根目錄。  
3. 前往 [Actions → Build & Release → Run workflow](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml) 手動執行 deploy 工作流。  
4. 等待約 40 秒後，於 [Releases](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/releases) 頁面下載安裝包。  
5. 簽署安裝包。  
6. 安裝。

## 自動部署

建立儲存庫變數：

| 變數名 | 值 |
|---|---|
| `AUTO_DEPLOY` | `true` |

當 `src/` 目錄變更時，工作流將自動觸發。

## 本地部署

我們為您提供本地部署立方之窗 UI Ore UI 版本。  
操作前，請確認終端機已安裝 Node.js 且版本 ≥ 20。  
在終端機輸入 `node -v` 檢查 Node.js 版本是否 ≥ 20。

1. 下載本儲存庫程式碼。  
2. 解壓縮壓縮包。  
3. 開啟終端機進入解壓縮後的資料夾。  
4. 輸入 `npm start`。  
5. 等待約 40 秒後，前往專案根目錄的 `dist` 資料夾。  
6. 簽署安裝包。  
7. 安裝。

## 瀏覽器除錯

我們為您提供線上除錯立方之窗 UI，以便快速預覽變更。  
操作前，請確認終端機已安裝 Node.js 且版本 ≥ 20。  
在終端機輸入 `node -v` 檢查 Node.js 版本是否 ≥ 20。

在進行除錯前，請將 resource_packs/oreui/texts 中的 .lang 檔案複製到 src/texts 資料夾中，
以及將 gui/dist/hbui/ 中的 .lang 檔案複製到 src/texts 資料夾中，檔案結構如下：

```text
cubevisage-ui-for-ore-ui/
├── package.json
├── dist/ # 輸出目錄
│   └── xxx.apk
└── src/
     ├── texts/ # 翻譯檔案
     └── xxx.apk # 任意安裝包
```

1. 下載本儲存庫程式碼。  
2. 解壓縮壓縮包。  
3. 開啟終端機進入解壓縮後的資料夾。  
4. 輸入 `npm run dev`。  
5. 在瀏覽器訪問 [0.0.0.0:8800](http://0.0.0.0:8800)。  

退出熱更新狀態請在終端機按 `q` 並 Enter。

## 更新 Fork 並與主庫同步

```bash
git remote add upstream https://github.com/wisebreeze/cubevisage-ui-for-ore-ui.git
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## 設定

執行工作流前，可編輯專案根目錄下的 `config.json` 檔案進行自訂。

## 貢獻

本儲存庫旨在持續發展立方之窗生態，改善使用者體驗。我們感謝社群貢獻錯誤修正與改進。閱讀下文了解如何參與改進立方之窗 UI Ore UI 版本。

### 行為準則

- 不得加入惡意程式碼。  
- 不得違反下文中授權條款。

### 貢獻指引

您可在 [issues](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/issues) 回報相關問題，並儘可能提供截圖與詳細描述，協助我們改進立方之窗 UI。

## 更新日誌

詳見 [CHANGELOG.zh-CN.md](./CHANGELOG.zh-TW.md)。

## 授權許可

- 使用 MIT 協議授權，與以下條款衝突的，應當以下方條款為主。  
- 必須保留原作者署名。  
- 本倉庫與任何公司、工作室無關。  
- 倉庫中提及的作品僅作標識，無其他含義。
- 原作者保留全部權利。