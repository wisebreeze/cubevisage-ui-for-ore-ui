// @ts-check
/**
 * 应用游戏玩法补丁
 * @param {string} jsCode JavaScript代码
 * @param {Object} config 配置对象
 * @returns {string} 修改后的代码
 */
export function applyGameplayPatches(jsCode, config) {
  let patched = jsCode
  
  if (config.bedtimeScreen?.chatAvailability === true) {
    let pos = 0
    let count = 0
    
    while ((pos = patched.indexOf('chatAvailability', pos)) !== -1) {
      count++
      if (count === 2) {
        const colonPos = patched.indexOf(':', pos)
        if (colonPos !== -1) {
          const commaPos = patched.indexOf(',', colonPos)
          if (commaPos !== -1) {
            patched = patched.substring(0, colonPos + 1) + ' !0' + patched.substring(commaPos)
          }
        }
        break
      }
      pos += 'chatAvailability'.length
    }
  }
  
  return patched
}