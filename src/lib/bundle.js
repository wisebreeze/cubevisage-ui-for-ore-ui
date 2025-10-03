// @ts-check
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import AdmZip from 'adm-zip'
import { transform } from '@swc/wasm'
import chalk from 'chalk'
import { execSync } from 'child_process'
import plist from 'plist'

import { CONFIG } from './config.js'
import { t } from './i18n.js'
import { ProgressTracker } from './progressTracker.js'
import { applyPatches } from './applyPatches.js'
import { applyGameplayPatches } from './applyGameplayPatches.js'
import { minify } from './minify.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SRC_DIR = path.join(__dirname, '..', '..', 'src')
const DIST_DIR = path.join(__dirname, '..', '..', 'dist')
const TEMP_BASE = path.join(__dirname, '..', '..', '.temp')
const LOCAL_TEXTS_DIR = path.join(__dirname, '..', 'sources', 'texts')
const HBUI_PATH = 'dist/hbui'
const INDEX_PATTERN = /^index.*\.js$/
const GAMEPLAY_PATTERN = /^gameplay.*\.js$/
const LICENSE_SUFFIX = '.LICENSE.txt'

const ensureDir = dir => !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true })
const cleanDir = dir => fs.existsSync(dir) && fs.rmSync(dir, { recursive: true, force: true })

const getAllFiles = (dir, fileList = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file)
    fs.statSync(filePath).isDirectory()
      ? getAllFiles(filePath, fileList)
      : fileList.push(filePath)
  })
  return fileList
}

function getFileType(filename) {
  if (filename.match(/\.apk(\.\d+)?$/i)) return 'apk'
  if (filename.match(/\.ipa(\.\d+)?$/i)) return 'ipa'
  if (filename.match(/\.appx(\.\d+)?$/i)) return 'appx'
  return null
}

function getConfigPaths(fileType) {
  return {
    targetFolder: CONFIG.targetFolder[fileType] || CONFIG.targetFolder.apk,
    translationsFolder: CONFIG.translationsFolder[fileType] || CONFIG.translationsFolder.apk
  }
}

function mergeTranslationFiles(apkTextsDir) {
  if (!fs.existsSync(LOCAL_TEXTS_DIR)) {
    console.log(chalk.yellow(t('noLocalTexts')))
    return
  }
  if (!fs.existsSync(apkTextsDir)) {
    console.log(chalk.yellow(t('noApkTexts', apkTextsDir)))
    return
  }
  console.log(t('mergingTranslations'))
  const localFiles = fs.readdirSync(LOCAL_TEXTS_DIR).filter(f => f.endsWith('.lang'))
  localFiles.forEach(localFile => {
    const localFilePath = path.join(LOCAL_TEXTS_DIR, localFile)
    const apkFilePath = path.join(apkTextsDir, localFile)
    const localContent = fs.readFileSync(localFilePath, 'utf8')
    const localLines = localContent.split('\n').filter(line => {
      const trimmed = line.trim()
      return trimmed && !trimmed.startsWith('#') && trimmed.includes('=')
    })
    const localMap = new Map()
    localLines.forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        localMap.set(key.trim(), valueParts.join('=').trim())
      }
    })
    if (fs.existsSync(apkFilePath)) {
      const apkContent = fs.readFileSync(apkFilePath, 'utf8')
      const apkLines = apkContent.split('\n')
      const newLines = []
      const processedKeys = new Set()
      apkLines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=')
          const trimmedKey = key.trim()
          if (localMap.has(trimmedKey)) {
            newLines.push(`${trimmedKey}=${localMap.get(trimmedKey)}`)
            processedKeys.add(trimmedKey)
          } else {
            newLines.push(line)
          }
        } else {
          newLines.push(line)
        }
      })
      localMap.forEach((value, key) => {
        if (!processedKeys.has(key)) {
          newLines.push(`${key}=${value}`)
        }
      })
      fs.writeFileSync(apkFilePath, newLines.join('\n'))
    } else {
      fs.copyFileSync(localFilePath, apkFilePath)
    }
  })
}

async function getVersionFromArchive(filePath, fileType) {
  const zip = new AdmZip(filePath)
  switch (fileType) {
    case 'apk': {
      const AppInfoParser = (await import('app-info-parser')).default
      return new AppInfoParser(filePath).parse().then(r => r.versionName)
    }
    case 'ipa': {
      const re = /^Payload\/[^/]+\.app\/Info\.plist$/i
      const entry = zip.getEntries().find(e => re.test(e.entryName))
      if (!entry) return null
      const obj = plist.parse(zip.readAsText(entry))
      return obj.CFBundleShortVersionString || null
    }
    case 'appx': {
      const entry = zip.getEntry('AppxManifest.xml')
      if (!entry) return null
      const xml = zip.readAsText(entry)
      const m = xml.match(/<Identity[^>]*Version="([^"]+)"/i)
      return m ? m[1] : null
    }
    default:
      return null
  }
}

const processFile = async (filePath, fileType) => {
  const fileName = path.basename(filePath)
  console.log(t('processing', fileName))

  const tempDir = path.join(TEMP_BASE, `${Date.now()}-${fileName}`)
  ensureDir(tempDir)

  const { targetFolder, translationsFolder } = getConfigPaths(fileType)

  try {
    console.log(t('extracting'))
    const zip = new AdmZip(filePath)
    const extractEntries = zip.getEntries()
      .filter(entry => {
        const entryName = entry.entryName
        return (
          (entryName.startsWith(targetFolder) || 
           (translationsFolder && entryName.startsWith(translationsFolder))) &&
          !entry.isDirectory
        )
      })

    const extractProgress = new ProgressTracker(extractEntries.length, t('extracting'))
    extractEntries.forEach(entry => {
      const destPath = path.join(tempDir, entry.entryName)
      ensureDir(path.dirname(destPath))
      fs.writeFileSync(destPath, zip.readFile(entry))
      extractProgress.update()
    })
    extractProgress.complete()

    const textsDir = path.join(tempDir, translationsFolder)
    if (fs.existsSync(textsDir)) {
      mergeTranslationFiles(textsDir)
    }

    const hbuiPath = path.join(tempDir, targetFolder, HBUI_PATH)
    if (!fs.existsSync(hbuiPath)) throw new Error(t('missingFolder', `${targetFolder}/${HBUI_PATH}`))

    console.log(t('processingJs'))
    const version = await getVersionFromArchive(filePath, fileType)
    const jsFiles = fs.readdirSync(hbuiPath)
      .filter(f => 
        (INDEX_PATTERN.test(f) || GAMEPLAY_PATTERN.test(f)) && 
        !f.endsWith(LICENSE_SUFFIX)
      )

    if (jsFiles.length > 0) {
      const jsProgress = new ProgressTracker(jsFiles.length, t('processingJs'))
      for (const file of jsFiles) {
        jsProgress.log(t('formatting', file))
        const filePath = path.join(hbuiPath, file)
        const code = fs.readFileSync(filePath, 'utf8')
        let { code: formatted } = await transform(code, {
          jsc: {
            parser: {
              syntax: 'ecmascript',
              jsx: false
            },
            target: 'es2020',
            minify: {
              compress: false,
              mangle: false
            }
          },
          minify: false
        })
        if (INDEX_PATTERN.test(file)) {
          formatted = applyPatches(formatted, CONFIG, version)
        } else if (GAMEPLAY_PATTERN.test(file)) {
          formatted = applyGameplayPatches(formatted, CONFIG, version)
        }
        if (CONFIG.minify) {
          jsProgress.log(t('minifyingFile', file))
          formatted = await minify(formatted, file)
        }
        fs.writeFileSync(filePath, formatted)
        jsProgress.update()
      }
      jsProgress.complete()
    }

    console.log(t('repacking'))
    const finalFile = path.join(DIST_DIR, fileName)
    const outputZip = new AdmZip(filePath)
    const modifiedFiles = getAllFiles(tempDir)

    const packProgress = new ProgressTracker(modifiedFiles.length, t('repacking'))
    modifiedFiles.forEach(file => {
      const relativePath = path.relative(tempDir, file)
      outputZip.addLocalFile(file, path.dirname(relativePath))
      packProgress.update()
    })
    outputZip.writeZip(finalFile)
    packProgress.complete()

    if (CONFIG.outputMcpack) {
      const mcpackName = `CubeVisage_UI_OreUI_${version || '1.0.0'}.mcpack`
      const mcpackPath = path.join(DIST_DIR, mcpackName)
      const mcpackZip = new AdmZip()
      const hbuiFullPath = path.join(tempDir, targetFolder, HBUI_PATH)
      if (fs.existsSync(hbuiFullPath)) {
        mcpackZip.addLocalFolder(hbuiFullPath, 'hbui')
      }
      const sourcesPath = path.join(__dirname, '..', 'sources')
      if (fs.existsSync(sourcesPath)) {
        const sourcesFiles = getAllFiles(sourcesPath)
        sourcesFiles.forEach(file => {
          const relativePath = path.relative(sourcesPath, file)
          mcpackZip.addLocalFile(file, path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath))
        })
      }
      mcpackZip.writeZip(mcpackPath)
    }

    console.log(chalk.green(t('success', fileName)))
  } catch (e) {
    console.error(chalk.red(t('error', e.message)))
  } finally {
    console.log(t('cleanup'))
    cleanDir(tempDir)
  }
}

(async () => {
  const startTime = Date.now()
  console.log(chalk.green(t('start')))

  cleanDir(TEMP_BASE)
  ensureDir(SRC_DIR)
  ensureDir(DIST_DIR)

  const allFiles = fs.readdirSync(SRC_DIR)
    .filter(f => /\.(apk(\.\d+)?|ipa(\.\d+)?|appx(\.\d+)?)$/i.test(f))
    .map(f => {
      const filePath = path.join(SRC_DIR, f)
      const fileType = getFileType(f)
      return { filePath, fileType, fileName: f }
    })
    .filter(file => file.fileType !== null)

  if (allFiles.length === 0) {
    console.log(chalk.yellow(t('apkFound', 0)))
    return
  }

  const sortedFiles = allFiles
    .filter(file => CONFIG.sequence.includes(file.fileType))
    .sort((a, b) => {
      const indexA = CONFIG.sequence.indexOf(a.fileType)
      const indexB = CONFIG.sequence.indexOf(b.fileType)
      return indexA - indexB
    })

  console.log(t('apkFound', sortedFiles.length))
  
  for (const file of sortedFiles) {
    await processFile(file.filePath, file.fileType)
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(chalk.green.bold(`\n${t('totalTime', totalTime)}`))
  cleanDir(TEMP_BASE)
})()