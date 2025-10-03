// @ts-check
import { transform } from 'esbuild'
import { t } from './i18n.js'
import chalk from 'chalk'

export async function minify(code, fileName) {
  try {
    let { code: result } = await transform(code, {
      loader: 'js',
      minify: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      target: 'es2020'
    })
    
    if (!result) {
      throw `Failed to compress the file ${fileName}: Cannot read properties of undefined`
    }
    
    return result
  } catch (error) {
    console.error(chalk.red(t('error', `Failed to compress the file ${fileName}}: ${error.message}`)))
    return code
  }
}