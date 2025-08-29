// @ts-check
import { replaceObjectPropertyValue, getReactElement } from './patchUtils.js'

/**
 * 应用游戏玩法补丁
 * @param {string} jsCode JavaScript代码
 * @param {Object} config 配置对象
 * @returns {string} 修改后的代码
 */
export function applyGameplayPatches(jsCode, config) {
  let patched = jsCode
  
  if (config.bedtimeScreen?.chatAvailability === true) {
    patched = replaceObjectPropertyValue(patched, '.leaveBedButton', 'when', '!1', 2, 'forward')
    patched = chatAvailability(patched)
  }
  
  return patched
}

function chatAvailability(code) {
  const targetPos = code.indexOf('.leaveBedButton')
  if (targetPos === -1) return code

  const reactElement = getReactElement(code, '.openChatButton')
  if (!reactElement) return code

  const createElementPos = code.indexOf('.createElement(', targetPos)
  if (createElementPos === -1) return code

  let varStart = createElementPos - 1
  while (varStart >= 0 && /[a-zA-Z0-9_$]/.test(code[varStart])) {
    varStart--
  }
  const varName = code.substring(varStart + 1, createElementPos)

  const elementEndPos = code.indexOf(')', createElementPos)
  const nextElementPos = code.indexOf('.createElement(', elementEndPos)

  const insertPos = nextElementPos !== -1 ? nextElementPos : elementEndPos + 1

  const wrapperElement = `${varName}.createElement(
                      "div",
                      {
                        style: {
                          justifyContent: "center",
                          width: "100%"
                        }
                      },
                      ${reactElement}
                    ), `

  return code.substring(0, insertPos - 1) + wrapperElement + code.substring(insertPos - 1)
}