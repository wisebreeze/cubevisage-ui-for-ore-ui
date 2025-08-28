import { createServer } from 'http'
import { readFile, stat } from 'fs/promises'
import { readFileSync, watch } from 'fs'
import { extname, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import JSON5 from 'json5'
import readline from 'readline'

import { t } from './i18n.js'
import { CONFIG as config } from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LANG = config.language || 'en-US'
const PORT = config.devServer.post || 8800
const HOST = config.devServer.host || '0.0.0.0'
const REQUEST_TIMEOUT = config.devServer.request_timeout || 4000
const USE_GAMEPLAY_ROUTES = config.devServer.use_gameplay_routes || false
let fallbackLangMap = {}
let currentLangMap = {}

function parseLang(text) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))

  const map = {}
  for (const line of lines) {
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim().replace('	#', '')
    if (key) map[key] = value
  }
  return map
}

const loadLangs = async () => {
  const langFiles = [
    resolve(__dirname, '..', 'texts', `${LANG.replace(/-/g, '_')}.lang`),
    resolve(__dirname, '..', 'texts', 'en_US.lang'),

    resolve(__dirname, '..', 'sources', 'texts', `${LANG.replace(/-/g, '_')}.lang`),
    resolve(__dirname, '..', 'sources', 'texts', 'en_US.lang')
  ]

  for (const filePath of langFiles) {
    try {
      const langText = readFileSync(filePath, 'utf-8')
      const langMap = parseLang(langText)
      
      if (filePath.includes(`${LANG.replace(/-/g, '_')}.lang`)) {
        Object.assign(currentLangMap, langMap)
      } else if (filePath.includes('en_US.lang')) {
        Object.assign(fallbackLangMap, langMap)
      }
    } catch (e) {
      const fileName = path.basename(filePath)
      if (filePath.includes(`${LANG.replace(/-/g, '_')}.lang`)) {
        console.warn(t('langError', fileName))
      } else {
        console.warn(t('langFallbackError', fileName))
      }
    }
  }
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

let engineScript = ''
let clients = new Set()

const loadEngineScript = async (tip = false) => {
  try {
    const newEngineScript = await readFile(resolve(__dirname, 'engine.js'), 'utf-8')
    if (newEngineScript !== engineScript) {
      engineScript = newEngineScript
      if (tip) console.log(t('engineLoadedOk'))
      return true
    }
    return false
  } catch (error) {
    if (tip) console.log(t('engineDefault'))
    return false
  }
}

const injectEngineScript = (htmlContent) => {
  const languages = JSON.stringify({
    ...fallbackLangMap,
    ...currentLangMap
  })
  return htmlContent.replace(
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    `<meta name="apple-mobile-web-app-capable" content="yes" />
    <style>
      * {
        box-sizing: border-box;
      }
    </style>
    <script>
      window.config = ${JSON.stringify(config)}
      window.serverLanguages = ${languages}
    </script>
    <script>${engineScript}</script>`
  )
}

const notifyClientsToReload = () => {
  clients.forEach(client => {
    client.res.write('data: reload\n\n')
  })
}

let isWatching = true
const watchers = []

const debounce = (fn, delay) => {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

const createHotHandler = (callback) =>
  debounce(async (eventType, filename) => {
    if (!isWatching || !filename) return
    const start = performance.now()
    if (callback) {
      try {
        await callback()
      } catch (error) {
        console.error('Error in hot handler callback:', error)
      }
    }
    const ms = (performance.now() - start).toFixed(0)
    console.log(t('loadedIn', filename, ms))
    notifyClientsToReload()
  }, 300)

watchers.push(
  watch(resolve(__dirname, '..', '..', 'hbui'), { recursive: true }, createHotHandler()),
  watch(resolve(__dirname, 'engine.js'), createHotHandler(async () => {
    await loadEngineScript()
  })),
  watch(resolve(__dirname, '..', 'texts'), createHotHandler(loadLangs))
)

const injectionHotReloadCode = `<script>
  const eventSource = new EventSource('/__hot_reload')
  eventSource.onmessage = function(event) {
    if (event.data === 'reload') {
      console.log('[Hot Reload] Reloading page...')
      window.location.reload()
    }
  }
  
  window.originalSetTimeout = window.setTimeout
  window.originalSetInterval = window.setInterval
  
  window.setTimeout = function(callback, delay, ...args) {
    if (delay > ${REQUEST_TIMEOUT}) {
      console.warn('[Timeout Warning] setTimeout delay reduced from', delay, 'to', ${REQUEST_TIMEOUT}, 'ms')
      delay = ${REQUEST_TIMEOUT}
    }
    return window.originalSetTimeout(callback, delay, ...args)
  }
  
  window.setInterval = function(callback, delay, ...args) {
    if (delay > ${REQUEST_TIMEOUT}) {
      console.warn('[Timeout Warning] setInterval delay reduced from', delay, 'to', ${REQUEST_TIMEOUT}, 'ms')
      delay = ${REQUEST_TIMEOUT}
    }
    return window.originalSetInterval(callback, delay, ...args)
  }
  
  const originalFetch = window.fetch
  window.fetch = function(...args) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ${REQUEST_TIMEOUT})
    
    return originalFetch(args[0], {
      ...args[1],
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId))
  }
</script>
</body>`

const server = createServer(async (req, res) => {
  const requestTimer = setTimeout(() => {
    if (!res.headersSent) {
      res.writeHead(408)
      res.end('Request Timeout')
    }
  }, REQUEST_TIMEOUT)

  if (req.url === '/__hot_reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })
    
    const client = { res }
    clients.add(client)
    
    req.on('close', () => {
      clearTimeout(requestTimer)
      clients.delete(client)
    })
    
    return
  }
  
  const filePath = resolve(__dirname, '..', '..', req.url.substring(1))
  const ext = extname(filePath)
  
  const nonHtmlExtensions = ['.mp3', '.mp4', '.wav', '.ogg', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.css', '.js', '.webm', '.avi', '.mov', '.pdf', '.zip', '.rar', '.7z']
  
  try {
    await stat(filePath)
    
    let content = await readFile(filePath)
    const contentType = mimeTypes[ext] || 'application/octet-stream'
    
    // 只有当是HTML文件且不是非HTML扩展名时才进行HTML处理
    if (ext === '.html' && filePath.endsWith(USE_GAMEPLAY_ROUTES ? 'index.html' : 'gameplay.html') && !nonHtmlExtensions.includes(ext)) {
      let htmlContent = content.toString()
      
      if (!htmlContent.includes('__hot_reload')) {
        htmlContent = htmlContent.replace('</body>', injectionHotReloadCode)
      }
      
      const modifiedContent = injectEngineScript(htmlContent)
      content = Buffer.from(modifiedContent)
    }
    
    clearTimeout(requestTimer)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(content, 'utf-8')
  } catch (error) {
    // 检查请求的文件是否存在
    try {
      await stat(filePath)
      // 如果文件存在，直接提供文件
      let content = await readFile(filePath)
      const contentType = mimeTypes[ext] || 'application/octet-stream'
      
      clearTimeout(requestTimer)
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content, 'utf-8')
    } catch (fileError) {
      // 文件不存在，回退到 hbui/index 或 hbui/gameplay
      try {
        let content = await readFile(resolve(__dirname, '..', '..', 'hbui', USE_GAMEPLAY_ROUTES ? 'index.html' : 'gameplay.html'))
        let htmlContent = content.toString()
        
        if (!htmlContent.includes('__hot_reload')) {
          htmlContent = htmlContent.replace('</body>', injectionHotReloadCode)
        }
        
        const modifiedContent = injectEngineScript(htmlContent)
        content = Buffer.from(modifiedContent)
        
        clearTimeout(requestTimer)
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(content, 'utf-8')
      } catch {
        clearTimeout(requestTimer)
        res.writeHead(404)
        res.end('Not Found')
      }
    }
  }
})

server.listen(PORT, HOST, async () => {
  await loadLangs()
  await loadEngineScript(true)
  console.log(t('serverStart', HOST, PORT))
  console.log(t('timeoutSet', REQUEST_TIMEOUT))
  console.log(t('pressQ'))
  console.log(t('allRoutes'))
  console.log(t('hotReload'))
  console.log("")
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.on('line', (input) => {
  if (input.trim().toLowerCase() === 'q') {
    console.log(t('stopping'))
    isWatching = false
    watchers.forEach(watcher => watcher.close())
    clients.forEach(client => client.res.end())
    clients.clear()
    server.close()
    rl.close()
    process.exit(0)
  }
})