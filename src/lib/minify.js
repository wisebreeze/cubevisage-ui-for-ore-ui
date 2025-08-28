// @ts-check
import { minify as minifyCode } from 'terser'
import { t } from './i18n.js'

export async function minify(code, fileName) {
  try {
    const commentMatch = code.match(/^(\/\*![\s\S]*?\*\/)/)
    const licenseComment = commentMatch ? commentMatch[1] + '\n' : ''
    
    const result = await minifyCode(code, {
      compress: {
        drop_console: false,
        drop_debugger: true,
        ecma: 2020,
        keep_classnames: false,
        keep_fnames: false,
        module: false,
        toplevel: true
      },
      mangle: {
        keep_classnames: false,
        keep_fnames: false
      },
      format: {
        comments: false,
        preamble: licenseComment,
        beautify: false,
        preserve_annotations: false
      },
      sourceMap: false
    })
    
    if (result.error) {
      throw result.error
    }
    
    result.code = result.code.replace(/^([^\n]*)\n\s*\n/, '$1\n')
    
    return result.code
  } catch (error) {
    console.error(chalk.red(t('error', `Failed to compress the file ${fileName}}: ${error.message}`)))
    return code
  }
}