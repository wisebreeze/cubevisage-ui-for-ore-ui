import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import https from 'https'
import chalk from 'chalk'
import { t } from './i18n.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMP_BASE = path.join(__dirname, '..', '..', '.temp')

/**
 * Check if Java is installed
 * @returns {boolean} True if Java is installed
 */
export function isJavaInstalled() {
  try {
    execSync('java -version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Get Java version
 * @returns {string|null} Java version string or null
 */
export function getJavaVersion() {
  try {
    const output = execSync('java -version 2>&1', { stdio: 'pipe', encoding: 'utf8' })
    const match = output.match(/version "(\d+\.\d+\.\d+[_0-9]*)/) || output.match(/version "(\d+)\./)
    return match ? match[1] : 'unknown'
  } catch {
    return null
  }
}

/**
 * Download file from URL
 * @param {string} url - Download URL
 * @param {string} destPath - Destination file path
 * @returns {Promise<void>}
 */
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`))
        return
      }
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', reject)
  })
}

/**
 * Install Java based on platform
 * @returns {Promise<boolean>} True if installation succeeded
 */
async function installJava() {
  const platform = os.platform()
  console.log(chalk.yellow(t('installingJava', platform)))
  
  try {
    if (platform === 'linux' || platform === 'android') {
      const isTermux = fs.existsSync('/data/data/com.termux')
      
      if (isTermux) {
        console.log(chalk.cyan(t('installingJavaTermux')))
        execSync('pkg update -y', { stdio: 'inherit' })
        execSync('pkg install openjdk-21 -y', { stdio: 'inherit' })
      } else {
        console.log(chalk.cyan(t('installingJavaLinux')))
        try {
          execSync('apt update && apt install -y openjdk-21-jdk', { stdio: 'inherit' })
        } catch {
          try {
            execSync('yum install -y java-21-openjdk', { stdio: 'inherit' })
          } catch {
            try {
              execSync('pacman -S --noconfirm jdk21-openjdk', { stdio: 'inherit' })
            } catch {
              throw new Error(t('javaInstallFailed'))
            }
          }
        }
      }
    } else if (platform === 'darwin') {
      console.log(chalk.cyan(t('installingJavaMac')))
      try {
        execSync('which brew', { stdio: 'pipe' })
        execSync('brew install openjdk@21', { stdio: 'inherit' })
        execSync('sudo ln -sfn $(brew --prefix)/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk', { stdio: 'inherit' })
      } catch {
        const javaUrl = 'https://github.com/AdoptOpenJDK/openjdk21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_mac_hotspot_21.0.2_13.tar.gz'
        const tarPath = path.join(TEMP_BASE, 'openjdk.tar.gz')
        const extractPath = path.join(TEMP_BASE, 'java')
        
        if (!fs.existsSync(TEMP_BASE)) fs.mkdirSync(TEMP_BASE, { recursive: true })
        await downloadFile(javaUrl, tarPath)
        execSync(`tar -xzf "${tarPath}" -C "${extractPath}"`, { stdio: 'pipe' })
        
        const javaHome = fs.readdirSync(extractPath).find(f => f.startsWith('jdk'))
        if (javaHome) {
          const javaBin = path.join(extractPath, javaHome, 'bin')
          process.env.PATH = `${javaBin}:${process.env.PATH}`
        }
      }
    } else if (platform === 'win32') {
      console.log(chalk.cyan(t('installingJavaWindows')))
      const javaUrl = 'https://github.com/AdoptOpenJDK/openjdk21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_windows_hotspot_21.0.2_13.zip'
      const zipPath = path.join(TEMP_BASE, 'openjdk.zip')
      const extractPath = path.join(TEMP_BASE, 'java')
      
      if (!fs.existsSync(TEMP_BASE)) fs.mkdirSync(TEMP_BASE, { recursive: true })
      await downloadFile(javaUrl, zipPath)
      
      const AdmZip = (await import('adm-zip')).default
      const zip = new AdmZip(zipPath)
      zip.extractAllTo(extractPath, true)
      
      const javaHome = fs.readdirSync(extractPath).find(f => f.startsWith('jdk'))
      if (javaHome) {
        const javaBin = path.join(extractPath, javaHome, 'bin')
        process.env.PATH = `${javaBin};${process.env.PATH}`
        process.env.JAVA_HOME = path.join(extractPath, javaHome)
      }
    }
    
    if (isJavaInstalled()) {
      console.log(chalk.green(t('javaInstalled', getJavaVersion())))
      return true
    } else {
      throw new Error(t('javaInstallFailed'))
    }
  } catch (error) {
    console.error(chalk.red(t('javaInstallError', error.message)))
    return false
  }
}

/**
 * Ensure Java is available (install if needed)
 * @returns {Promise<boolean>} True if Java is available
 */
async function ensureJava() {
  if (isJavaInstalled()) {
    console.log(chalk.green(t('javaFound', getJavaVersion())))
    return true
  }
  
  console.log(chalk.yellow(t('javaNotFound')))
  return await installJava()
}

/**
 * Sign APK using apksigner.jar with configurable signature schemes
 * @param {string} apkPath - Path to APK file
 * @param {object} signConfig - Signing configuration
 * @param {string} jarPath - Path to apksigner.jar
 * @returns {Promise<string>} Signed APK path
 */
export async function signApk(apkPath, signConfig, jarPath) {
  // Check if any signature scheme is enabled
  const v1Enabled = signConfig.v1 !== false  // 默认 true
  const v2Enabled = signConfig.v2 !== false  // 默认 true
  const v3Enabled = signConfig.v3 !== false  // 默认 true
  const v4Enabled = signConfig.v4 === true   // 默认 false
  
  if (!v1Enabled && !v2Enabled && !v3Enabled && !v4Enabled) {
    console.log(chalk.yellow(t('apkSignNoScheme')))
    return apkPath
  }
  
  console.log(chalk.blue(t('apkSigning', path.basename(apkPath))))
  
  try {
    // Ensure Java is available
    const javaAvailable = await ensureJava()
    if (!javaAvailable) {
      throw new Error(t('javaRequired'))
    }
    
    // Check if apksigner.jar exists
    if (!fs.existsSync(jarPath)) {
      throw new Error(t('apksignerNotFound', jarPath))
    }
    
    // Temporary rename to remove spaces
    const dir = path.dirname(apkPath)
    const originalName = path.basename(apkPath)
    const tempName = originalName.replace(/\s/g, '_')
    const tempApkPath = path.join(dir, tempName)
    
    if (originalName !== tempName) {
      fs.renameSync(apkPath, tempApkPath)
      apkPath = tempApkPath
    }
    
    // Get keystore
    let keystorePath = signConfig.keystore
    let storepass = signConfig.keystorePassword
    let alias = signConfig.keyAlias
    let keypass = signConfig.keyPassword
    
    if (!keystorePath || !fs.existsSync(keystorePath)) {
      if (signConfig.useDebugKeystore) {
        const homeDir = os.homedir()
        keystorePath = path.join(homeDir, '.android', 'debug.keystore')
        
        if (!fs.existsSync(keystorePath)) {
          console.log(chalk.yellow(t('generatingDebugKeystore')))
          const androidDir = path.join(homeDir, '.android')
          if (!fs.existsSync(androidDir)) fs.mkdirSync(androidDir, { recursive: true })
          execSync(`keytool -genkey -v -keystore "${keystorePath}" -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug, O=Android, C=US"`, {
            stdio: 'pipe'
          })
        }
        storepass = 'android'
        alias = 'androiddebugkey'
        keypass = 'android'
      } else {
        throw new Error(t('noKeystoreProvided'))
      }
    }
    
    // Build signature scheme flags
    const schemeFlags = []
    if (v1Enabled) schemeFlags.push('--v1-signing-enabled')
    else schemeFlags.push('--v1-signing-enabled=false')
    
    if (v2Enabled) schemeFlags.push('--v2-signing-enabled')
    else schemeFlags.push('--v2-signing-enabled=false')
    
    if (v3Enabled) schemeFlags.push('--v3-signing-enabled')
    else schemeFlags.push('--v3-signing-enabled=false')
    
    if (v4Enabled) schemeFlags.push('--v4-signing-enabled')
    else schemeFlags.push('--v4-signing-enabled=false')
    
    // 生成临时签名文件
    const signedPath = apkPath.replace(/\.apk(\.\d+)?$/i, '.signed.tmp')
    
    const schemesStr = `${v1Enabled ? 'V1 ' : ''}${v2Enabled ? 'V2 ' : ''}${v3Enabled ? 'V3 ' : ''}${v4Enabled ? 'V4' : ''}`.trim()
    console.log(chalk.gray(t('signingWithApksigner', schemesStr)))
    
    // 签名到临时文件
    const signCmd = `java -jar "${jarPath}" sign \
      --ks "${keystorePath}" \
      --ks-pass pass:${storepass} \
      --key-pass pass:${keypass} \
      --ks-key-alias ${alias} \
      ${schemeFlags.join(' ')} \
      --out "${signedPath}" \
      "${apkPath}"`
    
    execSync(signCmd, { stdio: 'inherit' })
    
    // 清理 .idsig 文件（V3/V4 签名会产生）
    const idsigPath = `${signedPath}.idsig`
    if (fs.existsSync(idsigPath)) {
      fs.unlinkSync(idsigPath)
    }
    
    // 验证签名
    console.log(chalk.gray(t('verifyingSignature')))
    const verifyCmd = `java -jar "${jarPath}" verify --verbose "${signedPath}"`
    execSync(verifyCmd, { stdio: 'inherit' })
    
    // 替换原文件
    fs.unlinkSync(apkPath)
    fs.renameSync(signedPath, apkPath)
    
    console.log(chalk.green(t('apkSignSuccess')))
    return apkPath
  } catch (error) {
    console.error(chalk.red(t('apkSignError', error.message)))
    throw error
  }
}