// @ts-check
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import JSON5 from 'json5'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json')

let CONFIG = {
  language: 'en-US'
}
try {
  if (fs.existsSync(CONFIG_PATH)) {
    Object.assign(CONFIG, JSON5.parse(fs.readFileSync(CONFIG_PATH, 'utf8')))
  }
} catch (e) {
  console.error(chalk.red('Config load failed:', e.message))
}

export { CONFIG }