// @ts-check
/**
 * 查找字符串中元素的位置
 * @param {string} str 源字符串
 * @param {number} start 开始位置索引
 * @returns {number} 位置索引，未找到返回-1
 */
function findMatchingParen(str, start) {
  let count = 1
  let pos = start + 1
  while (pos < str.length && count > 0) {
    if (str[pos] === '(') count++
    if (str[pos] === ')') count--
    pos++
  }
  return count === 0 ? pos - 1 : -1
}

/**
 * 移除指定属性名的元素节点
 * @param {string} code 源代码字符串
 * @param {string} propValue 要查找的属性值
 * @returns {string} 处理后的代码字符串
 */
export function removeElementByPropValue(code, propValue) {
  const startTemplateText = '"start-from-template"'
  const startPos = code.indexOf('"start-from-template"')
  if (startPos !== -1) {
    const PropsPos = code.indexOf(propValue, startPos)
    if (PropsPos !== -1) {
      const createElementStart = code.lastIndexOf('.createElement(', PropsPos)
      if (createElementStart !== -1) {
        const parenStart = code.indexOf('(', createElementStart)
        const parenEnd = findMatchingParen(code, parenStart)
        if (parenEnd !== -1) {
          const commaBefore = code.lastIndexOf(',', createElementStart)
          const commaAfter = code.indexOf(',', parenEnd)
          if (commaBefore !== -1) {
            let deleteEnd = commaAfter !== -1 ? commaAfter : parenEnd + 1
            code = code.substring(0, commaBefore) + code.substring(deleteEnd)
          } else {
            let deleteEnd = commaAfter !== -1 ? commaAfter : parenEnd + 1
            code = code.substring(0, createElementStart) + code.substring(deleteEnd)
          }
        }
      }
    }
  }
  return code
}

/**
 * 移除数组中指定位置的属性项
 * @param {string} code 源代码字符串
 * @param {string} searchText 要查找的标识文本
 * @param {string} propName 要移除的属性名
 * @param {number} occurrence 第几次出现
 * @returns {string} 处理后的代码字符串
 */
export function removeArrayPropertyItem(code, searchText, propName, occurrence = 2) {
  let pos = 0
  let count = 0
  
  while ((pos = code.indexOf(searchText, pos)) !== -1) {
    count++
    if (count === occurrence) {
      const propPos = code.indexOf(propName, pos)
      if (propPos !== -1) {
        const bracketStart = code.lastIndexOf('[', propPos)
        const bracketEnd = code.indexOf(']', propPos)
        
        if (bracketStart !== -1 && bracketEnd !== -1) {
          const itemStart = code.lastIndexOf('{', propPos)
          const itemEnd = code.indexOf('}', propPos) + 1
          
          if (itemStart !== -1 && itemEnd !== -1) {
            let beforeItem = code.substring(0, itemStart)
            let afterItem = code.substring(itemEnd)
            
            const lastCommaBefore = beforeItem.lastIndexOf(',')
            if (lastCommaBefore > bracketStart) {
              beforeItem = beforeItem.substring(0, lastCommaBefore) + beforeItem.substring(lastCommaBefore + 1)
            }
            
            if (afterItem.startsWith(',')) {
              afterItem = afterItem.substring(1)
            }
            
            return beforeItem + afterItem
          }
        }
      }
      break
    }
    pos += searchText.length
  }
  
  return code
}

/**
 * 替换对象属性中的布尔值
 * @param {string} code 源代码字符串
 * @param {string} searchText 要查找的标识文本
 * @param {string} propName 要修改的属性名
 * @param {string} newValue 新的属性值
 * @param {number} occurrence 第几次出现
 * @returns {string} 处理后的代码字符串
 */
export function replaceObjectPropertyValue(code, searchText, propName = 'when', newValue = '!1', occurrence = 1) {
  let pos = 0
  let count = 0
  
  while ((pos = code.indexOf(searchText, pos)) !== -1) {
    count++
    if (count === occurrence) {
      const propStart = code.lastIndexOf(propName + ':', pos)
      if (propStart !== -1) {
        const valueEnd = Math.min(
          code.indexOf(',', propStart) !== -1 ? code.indexOf(',', propStart) : Infinity,
          code.indexOf('}', propStart) !== -1 ? code.indexOf('}', propStart) : Infinity
        )
        if (valueEnd !== Infinity) {
          const valueStart = code.indexOf(':', propStart) + 1
          return code.substring(0, valueStart) + ` ${newValue}` + code.substring(valueEnd)
        }
      }
      break
    }
    pos += searchText.length
  }
  
  return code
}