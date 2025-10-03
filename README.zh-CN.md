<div align="left">
  <img src="https://raw.githubusercontent.com/wisebreeze/cubevisage-ui-for-ore-ui/main/src/sources/pack_icon.png" width="150" alt="CubeVisage Icon">
</div>

# 立方之窗 UI Ore UI 版本

[![GitHub release](https://img.shields.io/github/v/release/wisebreeze/cubevisage-ui-for-ore-ui)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/releases)
[![GitHub stars](https://img.shields.io/github/stars/wisebreeze/cubevisage-ui-for-ore-ui)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/stargazers)
[![许可证](https://img.shields.io/badge/许可证-MIT-green)](LICENSE)
[![(工作流) 构建](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml/badge.svg)](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml)

[English](/README.md) / [简体中文](/README.zh-CN.md) / [繁体中文](/README.zh-TW.md)

立方之窗 UI Ore UI 版本是一个基于 Ore UI 开发的用户界面。

* **简单：** 立方之窗 UI 使改进用户体验。无需代码基础，即可增强 Ore UI 的体验。
* **多端部署：** 立方之窗 UI 适用于多平台，为用户带来沉浸体验。

## 部署

1. Fork 本仓库。
2. 将原始游戏安装包上传到 `src/` 根目录。
3. 进入 [Actions → Build & Release → Run workflow](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/actions/workflows/deploy.yml) 手动运行 deploy 工作流。
4. 等待大约 40 秒后，在 [Releases](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/releases) 页面下载安装包。
5. 签名安装包。
6. 安装。

## 自动部署

新建仓库变量：

|变量名|值|
|---|---|
|`AUTO_DEPLOY`|`true`|

当 `src/` 目录发生变动时，工作流将自动触发。

## 本地部署

我们为您提供了本地部署 立方之窗 UI Ore UI 版本。  
在进行操作前，请检测您的终端是否安装 node.js 并且 node.js 版本 >= 20。  
在您的终端输入 `node -v` 检查 node.js 版本是否 >= 20。 

1. 下载本仓库代码。
2. 解压压缩包。
3. 打开终端访问解压后的文件夹。
4. 输入 `npm start`。
5. 等待大约 40 秒后，访问项目根目录的 `dist` 文件夹。
6. 签名安装包。
7. 安装。

## 浏览器调试

我们为您提供了在线调试 立方之窗 UI，以快速预览更改。  
在进行操作前，请检测您的终端是否安装 node.js 并且 node.js 版本 >= 20。  
在您的终端输入 `node -v` 检查 node.js 版本是否 >= 20。 

在进行调试前，请将 `resource_packs/oreui/texts` 的 .lang 文件复制到 `src/texts` 文件夹中，  
以及 `gui/dist/hbui/` 的 .lang 文件复制到 `src/texts` 文件夹中，文件结构如下：

```text
cubevisage-ui-for-ore-ui/
├── package.json
├── dist/ # 输出目录
│   └── xxx.apk
└── src/
     ├── texts/ # 翻译文件
     └── xxx.apk # 任意安装包
```

1. 下载本仓库代码。
2. 解压压缩包。
3. 打开终端访问解压后的文件夹。
4. 输入 `npm run dev`。
5. 在浏览器访问 [0.0.0.0:8800](0.0.0.0:8800)。

退出热更新状态请在终端键入 `q` 并回车。

## 更新 Fork 与主库同步

```bash
git remote add upstream https://github.com/wisebreeze/cubevisage-ui-for-ore-ui.git
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## 配置

运行工作流前，可编辑项目根目录下的 `config.json` 文件以自定义更改。

## 贡献

该仓库的目的是继续发展立方之窗生态，使其改进用户体验。我们感谢社区贡献错误修复和改进。阅读下文，了解如何参与改进 立方之窗 UI Ore UI 版本。

### 行为准则

- 您不得添加恶意代码
- 您不得违下文中许可证中的条款

### 贡献指引

您可以在 [issues](https://github.com/wisebreeze/cubevisage-ui-for-ore-ui/issues) 中反馈相关问题，尽可能地提供截图及其详细的描述，这将有助于我们更好地改进立方之窗 UI。

## 更新日志

详见 [CHANGELOG.zh-CN.md](./CHANGELOG.zh-CN.md)。

## 许可证

- 使用 MIT 协议授权，与以下条款冲突的，应当以下方条款为主。  
- 必须保留原作者署名。  
- 本仓库与任何公司、工作室无关。  
- 仓库中提及的作品仅作标识，无其他含义。
- 原作者保留全部权利。  