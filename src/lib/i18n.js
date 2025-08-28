import { CONFIG } from './config.js'

const TEXT = {
  'zh-CN': {
    start: '🚀 开始处理安装包文件',
    apkFound: c => `🔍 找到 ${c} 个安装包文件`,
    processing: name => `\n🔄 处理中: ${name}`,
    extracting: '📦 解压中...',
    missingFolder: p => `❌ 缺少文件夹: ${p}`,
    processingJs: '🔄 处理JS文件...',
    formatting: f => `✨ 格式化: ${f}`,
    mergingTranslations: '🌐 合并翻译文件...',
    noLocalTexts: '⚠️ 本地翻译文件夹不存在，跳过合并',
    noApkTexts: p => `⚠️ 安装包翻译文件夹不存在: ${p}`,
    minifyingFile: f => `🔨 压缩: ${f}`,
    repacking: '📦 重新打包中...',
    success: f => `✅ 完成: ${f}`,
    cleanup: '🧹 清理临时文件...',
    error: m => `⛔ 错误: ${m}`,
    totalTime: s => `🏁 全部完成! 总耗时: ${s}秒`,
    
    serverStart: (h, p) => `服务已启动：http://${h}:${p}/`,
    timeoutSet: t => `请求超时时间设为 ${t}ms`,
    pressQ: '按 q + 回车 停止监听并退出',
    allRoutes: '所有路由都会回退到 /hbui/index.html',
    hotReload: '已启用热重载 —— 文件变动时浏览器将自动刷新',
    loadedIn: (f, ms) => `[热更新] ${f} 加载耗时 ${ms}ms`,
    engineDefault: '[引擎] 使用默认脚本',
    engineLoadedOk: '[引擎] 脚本加载成功',
    langError: f => `[热更新] ${f} 文件不存在，使用回退语言`,
    langFallbackError: f => `[热更新] ${f} 文件不存在`,
    stopping: '正在停止文件监听并退出...'
  },
  'zh-TW': {
    start: '🚀 開始處理安裝包文件',
    apkFound: c => `🔍 找到 ${c} 個安裝包文件`,
    processing: name => `\n🔄 處理中: ${name}`,
    extracting: '📦 解壓中...',
    missingFolder: p => `❌ 缺少文件夾: ${p}`,
    processingJs: '🔄 處理JS文件...',
    formatting: f => `✨ 格式化: ${f}`,
    minifyingFile: f => `🔨 壓縮: ${f}`,
    repacking: '📦 重新打包中...',
    mergingTranslations: '🌐 合併翻譯文件...',
    noLocalTexts: '⚠️ 本地翻譯文件夾不存在，跳過合併',
    noApkTexts: p => `⚠️ 安裝包翻譯文件夾不存在: ${p}`,
    success: f => `✅ 完成: ${f}`,
    cleanup: '🧹 清理臨時文件...',
    error: m => `⛔ 錯誤: ${m}`,
    totalTime: s => `🏁 全部完成! 總耗時: ${s}秒`,
    
    serverStart: (h, p) => `服务已启动：http://${h}:${p}/`,
    timeoutSet: t => `请求逾时时间设為 ${t}ms`,
    pressQ: '按 q + Enter 停止监听並离开',
    allRoutes: '所有路由都会回退到 /hbui/index.html',
    hotReload: '已启用热重载 —— 档案变动时浏览器将自动重新整理',
    loadedIn: (f, ms) => `[热更新] ${f} 载入耗时 ${ms}ms`,
    engineDefault: '[引擎] 使用预设脚本',
    engineLoadedOk: '[引擎] 脚本载入成功',
    langError: f => `[热更新] ${f} 文件不存在，使用回退语言`,
    langFallbackError: f => `[热更新] ${f} 文件不存在`,
    stopping: '正在停止档案监听並离开...'
  },
  'en-US': {
    start: '🚀 Starting installation package processing',
    apkFound: c => `🔍 Found ${c} installation package files`,
    processing: name => `\n🔄 Processing: ${name}`,
    extracting: '📦 Extracting...',
    missingFolder: p => `❌ Missing folder: ${p}`,
    processingJs: '🔄 Processing JS files...',
    formatting: f => `✨ Formatting: ${f}`,
    minifyingFile: f => `🔨 Minifying: ${f}`,
    repacking: '📦 Repacking...',
    mergingTranslations: '🌐 Merging translation files...',
    noLocalTexts: '⚠️ Local texts folder does not exist, skipping merge',
    noApkTexts: p => `⚠️ Installation package texts folder does not exist: ${p}`,
    success: f => `✅ Success: ${f}`,
    cleanup: '🧹 Cleaning temp files...',
    error: m => `⛔ Error: ${m}`,
    totalTime: s => `🏁 All done! Total time: ${s}s`,
    
    serverStart: (h, p) => `Server running at http://${h}:${p}/`,
    timeoutSet: t => `Request timeout set to ${t}ms`,
    pressQ: 'Press "q" + Enter to stop watching and exit',
    allRoutes: 'All routes will serve /hbui/index.html',
    hotReload: 'Hot reload is enabled - browser will auto-refresh on changes',
    loadedIn: (f, ms) => `[Hot Update] Loaded ${f} in ${ms}ms`,
    engineDefault: '[Engine] Using default script',
    engineLoadedOk: '[Engine] Script loaded successfully',
    langError: f => `[Hot Update] Cannot load ${f}, use the fallback language`,
    langFallbackError: f => `[Hot Update] Cannot load ${f}`,
    stopping: 'Stopping file watcher and exiting...'
  }
}

export const t = (key, ...args) => {
  const lang = TEXT[CONFIG.language] || TEXT['en-US']
  return typeof lang[key] === 'function' ? lang[key](...args) : lang[key]
}