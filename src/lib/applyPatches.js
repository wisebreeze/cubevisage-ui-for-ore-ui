// @ts-check
import { replaceObjectPropertyValue, removeArrayPropertyItem, removeElementByPropValue, isVersionGreaterOrEqual } from './patchUtils.js'

/**
 * 在字符串中修改后的逻辑条件
 * @param {string} code 原始代码字符串
 * @returns {string} 修改后的代码字符串
 */
function removeOrConditionAfterLayoutMode(code) {
  const target = 'playScreenWorldLayoutMode'
  const orPattern = /\|\|/g
  const maxSearchDistance = 20

  let index = code.indexOf(target)
  if (index === -1) return code

  const searchEnd = Math.min(index + target.length + maxSearchDistance, code.length)
  const searchArea = code.substring(index, searchEnd)

  let orIndex = searchArea.indexOf('||')
  if (orIndex === -1) return code

  orIndex += index

  let conditionEnd = orIndex + 2
  let parenBalance = 0
  let foundEnd = false

  while (conditionEnd < code.length && !foundEnd) {
    const char = code[conditionEnd]
    if (char === '(') parenBalance++
    if (char === ')') parenBalance--
    
    if ((char === ',' || char === ';' || (char === ')' && parenBalance < 0)) && parenBalance <= 0) {
      foundEnd = true
    } else {
      conditionEnd++
    }
  }

  return code.substring(0, orIndex) + code.substring(conditionEnd)
}

/**
 * 应用主要补丁
 * @param {string} jsCode JavaScript代码
 * @param {Object} config 配置对象
 * @returns {string} 修改后的代码
 */
export function applyPatches(jsCode, config, version = '') {
  let patched = jsCode

  let translationPrefixCount = 0
  let pos = 0
  let translationName = ''
  const is1_21_110 = isVersionGreaterOrEqual(version, '1.21.110')
  
  while ((pos = patched.indexOf('translationPrefix', pos)) !== -1) {
    translationPrefixCount++
    if (translationPrefixCount === 5) {
      const functionStart = patched.lastIndexOf('function', pos)
      if (functionStart !== -1) {
        const nameStart = functionStart + 8
        const nameEnd = patched.indexOf('(', nameStart)
        if (nameEnd !== -1) {
          translationName = patched.substring(nameStart, nameEnd).trim()
        }
      }
      break
    }
    pos += 'translationPrefix'.length
  }

  if (config.global?.enhancedDropDown) {
    patched = patched.replace(/15\s*\*\s*(\w+)\.length/g, '10 * $1.length')
  }

  if (config.global?.friendsDrawer) {
    const disableIdx = patched.indexOf('disableBackButton')
    if (disableIdx === -1) return patched
    const closeIdx = patched.indexOf('}) {', disableIdx)
    if (closeIdx === -1) return patched
    const slice = patched.slice(disableIdx, closeIdx)
    const m = slice.match(/friendsDrawer:\s*(\w+)/)
    if (!m) return patched
    const varName = m[1]
    const insertPos = closeIdx + 4
    patched =
      patched.slice(0, insertPos) +
      `\n        ${varName} = !0;` +
      patched.slice(insertPos)
  }

  if (config.global?.alwaysShowScrollbar) {
    const checkStr = 'checkForDynamicScrollArea'
    let startPos = 0
    let count = 0
    let secondCheckPos = -1
    
    while ((startPos = patched.indexOf(checkStr, startPos)) !== -1) {
      count++
      if (count === 2) {
        secondCheckPos = startPos
        break
      }
      startPos += checkStr.length
    }
    
    if (secondCheckPos !== -1) {
      const arrowPos = patched.indexOf('=>', secondCheckPos)
      if (arrowPos !== -1) {
        const questionPos = patched.indexOf('?', arrowPos + 2)
        if (questionPos !== -1) {
          patched = patched.substring(0, arrowPos + 2) + ' !0 ' + patched.substring(questionPos)
        }
      }
    }
  }

  if (config.worldScreen?.worldTypeDropdown) {
    const generatorLabel = '.generatorTypeLabel'
    let pos = 0
    let count = 0
    while ((pos = patched.indexOf(generatorLabel, pos)) !== -1) {
      const optionsStart = patched.indexOf('options: [', pos)
      if (optionsStart !== -1) {
        const optionsEnd = patched.indexOf(']', optionsStart)
        if (optionsEnd !== -1) {
          const optionsContent = patched.substring(optionsStart, optionsEnd)
          const vuMatch = optionsContent.match(/(\w+)\.\w+/)
          const iMatch = optionsContent.match(/(\w+)\(/)
          
          const vuVar = vuMatch ? vuMatch[1] : 'Vu'
          const iVar = iMatch ? iMatch[1] : 'i'

          const lastItemEnd = patched.lastIndexOf('}', optionsEnd)
          if (lastItemEnd !== -1) {
            const newItem = `,\n                                {
                                  value: ${vuVar}.Legacy,
                                  label: ${iVar}(".legacyWorldGeneratorLabel"),
                                  description: ${iVar}(
                                    ".legacyWorldGeneratorDescription"
                                  ),
                                }`
            patched = patched.substring(0, lastItemEnd + 1) + newItem + patched.substring(lastItemEnd + 1)
          }
        }
      }
      const whenStart = patched.lastIndexOf('when:', pos)
      if (whenStart !== -1) {
        const valueEnd = Math.min(
          patched.indexOf(',', whenStart) !== -1 ? patched.indexOf(',', whenStart) : Infinity,
          patched.indexOf('}', whenStart) !== -1 ? patched.indexOf('}', whenStart) : Infinity
        )
        
        if (valueEnd !== Infinity) {
          const valueStart = patched.indexOf(':', whenStart) + 1
          patched = patched.substring(0, valueStart) + ' !0' + patched.substring(valueEnd)
        }
      }
      
      if (!is1_21_110 || count === 0) {
        const questionPos = patched.lastIndexOf('?', pos)
        if (questionPos !== -1) {
          const commaPos = patched.lastIndexOf(',', questionPos)
          if (commaPos !== -1) {
            patched = patched.substring(0, commaPos + 1) + '\n                      !1' + patched.substring(questionPos)
          }
        }
      }
      
      pos += generatorLabel.length
      count++
      if (count >= 2) break
    }
  }

  if (config.worldScreen?.exportWorld) {
    patched = replaceObjectPropertyValue(patched, '.fileManagementDeleteWorldLabel', 'when', '!0', 2, 'forward')
    patched = replaceObjectPropertyValue(patched, 'onExportTemplate', 'when', '!0', 2)
  }

  if (config.worldScreen?.debug) {
    const debugTabLabel = 'label: ".debugTabLabel"'
    let pos = 0
    while ((pos = patched.indexOf(debugTabLabel, pos)) !== -1) {
      const arrowPos = patched.lastIndexOf('=>', pos)
      if (arrowPos !== -1) {
        const questionPos = patched.indexOf('?', arrowPos)
        if (questionPos !== -1) {
          const between = patched.substring(arrowPos + 2, questionPos).trim()
          if (between && between !== '!0') {
            patched = patched.substring(0, arrowPos + 2) + 
              ' !0 ' + 
              patched.substring(questionPos)
          }
        }
      }
      pos += debugTabLabel.length
    }
  }

  if (config.worldScreen?.marketplacePass === false) {
    patched = replaceObjectPropertyValue(patched, '.marketplacePassPacksAccordionHeader')
  }

  if (config.worldScreen?.getMoreResource === false) {
    const buttonId = 'Get_More_Packs_Button_OreUI'
    let pos = 0
    while ((pos = patched.indexOf(buttonId, pos)) !== -1) {
      const returnPos = patched.indexOf('return', pos)
      if (returnPos !== -1) {
        const funcEnd = patched.indexOf('},', returnPos)
        if (funcEnd !== -1) {
          patched = patched.substring(0, returnPos + 6) + ' null' + patched.substring(funcEnd)
        }
      }
      pos += buttonId.length
    }
  }

  if (config.worldScreen?.realms === false) {
    patched = replaceObjectPropertyValue(patched, 'isRealmsButtonDisabled', 'when', '!1', is1_21_110 ? 2 : 1)
  }

  if (config.worldScreen?.hardcoreModeDisabled === false) {
    patched = replaceObjectPropertyValue(patched, '.hardcoreModeDescription', 'disabled', '!1')
  }

  if (config.worldScreen?.experimentalDisabled === false) {
    patched = replaceObjectPropertyValue(patched, 'numOfSections', 'disabled', '!1', 2)
  }

  if (config.worldScreen?.daylightCycleLockTime === true) {
    const searchText = '.daylightCycleLockTimeLabel'
    let pos = 0
    let count = 0
    while ((pos = patched.indexOf(searchText, pos)) !== -1) {
      if (count === 0) {
        const returnPos = patched.lastIndexOf('return', pos)
        const andPos = patched.indexOf('&&', returnPos)
        if (returnPos !== -1 && andPos !== -1) {
          const contentStart = returnPos + 6
          const contentEnd = andPos
          const content = patched.substring(contentStart, contentEnd).trim()
          if (content && content !== '!0') {
            patched = patched.substring(0, contentStart) + 
              ' !0 ' + 
              patched.substring(contentEnd)
          }
        }
      } else {
        const semicolonPos = patched.lastIndexOf(';', pos)
        if (semicolonPos !== -1) {
          const andPos = patched.indexOf('&&', semicolonPos)
          if (andPos !== -1) {
            const contentStart = semicolonPos + 1
            const contentEnd = andPos
            const content = patched.substring(contentStart, contentEnd).trim()
            if (content && content !== '!0') {
              patched = patched.substring(0, contentStart) + 
                ' !0 ' + 
                patched.substring(contentEnd)
            }
          }
        }
      }
      pos += searchText.length
      count++
    }
  }

  if (config.worldScreen?.gamemode === true) {
    let searchText = '.gameModeCreativeDescription'
    let pos = 0
    let count = 0
    
    while ((pos = patched.indexOf(searchText, pos)) !== -1 && count < 2) {
      const objStart = patched.lastIndexOf('{', pos)
      const objEnd = patched.indexOf('}', pos)
      if (objStart !== -1 && objEnd !== -1) {
        const objContent = patched.slice(objStart, objEnd + 1)
        const cVar = objContent.match(/(\w+)\(["']\.gameModeCreativeLabel/)?.[1] || translationName || 'c'
        const yuVar = objContent.match(/value:\s*(\w+)\.CREATIVE/)?.[1] || 'yu'
        const iVar = objContent.match(/narrationSuffix:\s*(\w+)\(/)?.[1] || 'i'

        const returnPos = patched.indexOf('return (', pos)
        if (returnPos !== -1) {
          const andPos = patched.indexOf('&&', returnPos)
          if (andPos !== -1) {
            patched = patched.substring(0, returnPos + 7) + '!0 ' + patched.substring(andPos)
            
            const pushStart = patched.indexOf('.push(', returnPos)
            if (pushStart !== -1) {
              let bracketCount = 0
              let commaPos = -1
              let currentPos = pushStart + 6
              
              while (currentPos < patched.length) {
                if (patched[currentPos] === '(') bracketCount++
                if (patched[currentPos] === ')') {
                  if (bracketCount === 0) break
                  bracketCount--
                }
                if (patched[currentPos] === ',' && bracketCount === 0) {
                  commaPos = currentPos
                }
                currentPos++
              }
              
              if (commaPos !== -1) {
                const newItem = `\n                    {
                      label: ${cVar}(".gameModeSpectatorLabel"),
                      description: ${cVar}(".gameModeSpectatorDescription"),
                      value: ${yuVar}.SPECTATOR,
                      narrationSuffix: ${iVar}(".narrationSuffixEnablesAchievements")
                    }`
                patched = patched.substring(0, commaPos) + ',' + newItem + patched.substring(commaPos + 1)
              } else {
                const insertPos = pushStart + 6
                const newItem = `\n                    {
                      label: ${cVar}(".gameModeSpectatorLabel"),
                      description: ${cVar}(".gameModeSpectatorDescription"),
                      value: ${yuVar}.SPECTATOR,
                      narrationSuffix: ${iVar}(".narrationSuffixEnablesAchievements")
                    },`
                patched = patched.substring(0, insertPos) + newItem + patched.substring(insertPos)
              }
            }
          }
        }
      }
      pos += searchText.length
      count++
    }
  }

  if (config.worldScreen?.translations === true) {
    const searchText = 'allBiomes'
    const pos = patched.indexOf(searchText)
    if (pos !== -1) {
      const constPos = patched.lastIndexOf('const', pos)
      if (constPos !== -1) {
        const insertPos = constPos + 5
        patched = patched.substring(0, insertPos) + ` { t: translate } = ${translationName}("CreateNewWorld.debug"),` + patched.substring(insertPos)
      }
    }
    const replacements = [
      ['Flat nether', 'flatNether'],
      ['Enable game version override', 'enableGameVersionOverride'],
      ['Game version override', 'gameVersionOverride'],
      ['World biome settings', 'worldBiomeSettings'],
      ['Default spawn biome', 'defaultSpawnBiome'],
      ['Using the default spawn biome will mean a random overworld spawn is selected', 'defaultSpawnBiomeDescription'],
      ['Spawn dimension filter', 'spawnDimensionFilter'],
      ['label: "Overworld"', 'spawnDimensionFilter.overworld', 'label: '],
      ['label: "Nether"', 'spawnDimensionFilter.nether', 'label: '],
      ['label: "The End"', 'spawnDimensionFilter.theEnd', 'label: '],
      ['Spawn biome', 'spawnBiome'],
      ['Biome override', 'biomeOverride'],
      ['Select biome to be used in the entire world', 'biomeOverrideDropdownDescription'],
      ['Set the world to a selected biome. This will override the Spawn biome!', 'biomeOverrideDescription']
    ]
    replacements.forEach(([oldText, newKey, prefix]) => {
      patched = patched.replaceAll(prefix ? `${oldText}` : `"${oldText}"`, (prefix || ``) + `translate(".${newKey}")`)
    })
  }

  if (config.playScreen?.createFromTemplate === true) {
    let searchText = '.createNewWorldNarration'
    let pos = 0
    let count = 0
    
    while ((pos = patched.indexOf(searchText, pos)) !== -1) {
      count++
      if (count === 2) {
        let questionPos = patched.lastIndexOf('?', pos)
        if (questionPos !== -1) {
          let equalsPos = patched.lastIndexOf('=', questionPos)
          if (equalsPos !== -1) {
            let beforeEquals = patched.substring(0, equalsPos + 1)
            let afterQuestion = patched.substring(questionPos)
            patched = beforeEquals + ' !1' + afterQuestion
          }
        }
        break
      }
      pos += searchText.length
    }
  }

  if (config.playScreen?.gridLayout === true) {
    let searchText = 'PlayScreen.ButtonHeader.narration'
    let pos = patched.indexOf(searchText)
    if (pos !== -1) {
      let layoutButtonPos = patched.indexOf('layoutButton', pos)
      if (layoutButtonPos !== -1) {
        let colonPos = patched.indexOf(':', layoutButtonPos)
        if (colonPos !== -1) {
          let questionPos = patched.indexOf('?', colonPos)
          if (questionPos !== -1) {
            let beforeColon = patched.substring(0, colonPos + 1)
            let afterQuestion = patched.substring(questionPos)
            patched = beforeColon + ' !1' + afterQuestion
          }
        }
      }
    }
    patched = removeOrConditionAfterLayoutMode(patched)
  }

  if (config.startFromTemplateScreen?.simple === true) {
    const searchText = 'StartFromTemplateRoute.OwnedByMe'
    const pos = patched.indexOf(searchText)
    if (pos !== -1) {
      const returnPos = patched.indexOf('return', pos)
      if (returnPos !== -1) {
        const insertPos = returnPos + 6
        patched = patched.substring(0, insertPos) + ' !0 ? null : ' + patched.substring(insertPos)
      }
    }
  }

  if (config.startFromTemplateScreen?.importButton === true) {
    const searchText = '.goToMarketplaceButton'
    const pos = patched.indexOf(searchText)
    if (pos !== -1) {
      const questionPos = patched.lastIndexOf('?', pos)
      if (questionPos !== -1) {
        const arrowPos = patched.lastIndexOf('=>', questionPos)
        if (arrowPos !== -1) {
          patched = patched.substring(0, arrowPos + 2) + ' !0 ' + patched.substring(questionPos)
        }
      }
    }
  }

  if (config.startFromTemplateScreen?.hideMarketplacePass === true) {
    patched = removeArrayPropertyItem(patched, 'StartFromTemplateRoute.SideMenu', '.marketplacePass')
    
    const templatePath = '/start-from-template/${'
    const templatePos = patched.indexOf(templatePath)
    if (templatePos !== -1) {
      const questionPos = patched.indexOf('?', templatePos)
      if (questionPos !== -1) {
        const conditionStart = patched.lastIndexOf('{', questionPos)
        if (conditionStart !== -1 && conditionStart > templatePos) {
          const conditionEnd = patched.indexOf('?', conditionStart)
          if (conditionEnd !== -1) {
            patched = patched.substring(0, conditionStart + 1) + '!1' + patched.substring(conditionEnd)
          }
        }
      }
    }
    
    patched = removeElementByPropValue(patched, '.MarketplacePass')
    
    const oldPath = '"/start-from-template/marketplace-pass"'
    const newPath = '"/start-from-template/owned-by-me"'
    patched = patched.split(oldPath).join(newPath)
  }

  if (config.startFromTemplateScreen?.hideFeatured === true) {
    patched = removeArrayPropertyItem(patched, 'StartFromTemplateRoute.SideMenu', '.featured')
    patched = removeElementByPropValue(patched, '.Featured')
  }

  return patched
}