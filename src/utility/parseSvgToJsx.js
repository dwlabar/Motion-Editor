// -----------------------------------------------------------------------------
// utility/parseSvgToJsx.js
// -----------------------------------------------------------------------------
// Version History
//
// v0.0.5
// - Sanitize SVG input, normalize React attributes, and retain text/references.
//
// v0.0.4
// - Retain anonymous groups so ancestor transforms and styles survive import.
//
// v0.0.2
// - Async SVG-to-JSX and shape-list conversion.
//
// v0.0.3
// - Single parser for direct SVG imports and project restoration.
// -----------------------------------------------------------------------------

import React from 'react'
import { parse } from 'svgson'
import { sanitizeSvg } from './sanitizeSvg'

export async function parseSvgTextToJsxAndShapes(svgText) {
  try {
    const { source, warnings } = sanitizeSvg(svgText)
    const parsed = await parse(source)
    const shapeList = []
    const svgTree = convertToJSX(parsed, shapeList)

    if (!svgTree) {
      return null
    }

    return {
      svgTree,
      shapeList,
      warnings
    }
  } catch (error) {
    return { svgTree: null, shapeList: [], error: error.message || 'SVG could not be imported.' }
  }
}

function isValidShape(tag) {
  return [
    'path',
    'rect',
    'circle',
    'ellipse',
    'polygon',
    'polyline',
    'line',
    'g'
  ].includes(tag)
}

function convertToJSX(node, shapeList, inDefinition = false, key = 'svg') {
  if (node?.type === 'text') return decodeXmlValue(node.value)
  if (!node || !node.name) return null

  const { name, children } = node
  const attributes = Object.fromEntries(Object.entries(node.attributes || {})
    .map(([key, value]) => [key, decodeXmlValue(value)]))

  const isDefinition = inDefinition || ['defs', 'clipPath', 'mask', 'pattern', 'marker', 'symbol'].includes(name)
  if (!isDefinition && attributes?.id && isValidShape(name)) {
    shapeList.push({
      id: attributes.id,
      type: name,
      label: attributes.id
    })
  }

  const props = {
    key,
    ...preserveVisualAttributes(attributes)
  }

  // Anonymous groups still carry inherited styles and parent transforms.
  const childElements = (children || []).map((child, index) =>
    convertToJSX(child, shapeList, isDefinition, `${key}-${index}`))

  return React.createElement(
    name,
    props,
    ...childElements.filter(Boolean)
  )
}

// svgson retains XML entities. Decode once before handing values to React,
// which performs its own escaping (including quotes in serialized CSS values).
function decodeXmlValue(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
  return value.replace(/&(amp|lt|gt|quot|apos|#x[\da-f]+|#\d+);/gi, (match, entity) => {
    if (entity[0] !== '#') return entities[entity] || match
    return String.fromCodePoint(entity[1].toLowerCase() === 'x'
      ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10))
  })
}

function preserveVisualAttributes(attrs = {}) {
  const cleaned = {}

  for (const key in attrs) {
    if (key.startsWith('inkscape:') || key.startsWith('sodipodi:')) continue

    if (key === 'style') {
      cleaned.style = parseStyleString(attrs.style)
    } else if (key === 'class') {
      cleaned.className = attrs[key]
    } else {
      const reactKey = key === 'tabindex' ? 'tabIndex'
        : /^(aria|data)-/.test(key) ? key
          : key.replace(/[-:]([a-z])/g, (_, letter) => letter.toUpperCase())
      cleaned[reactKey] = attrs[key]
    }
  }

  return cleaned
}

function parseStyleString(styleString) {
  const style = {}
  if (!styleString) return style

  const declaration = document.createElementNS('http://www.w3.org/2000/svg', 'g').style
  declaration.cssText = styleString
  for (const key of Array.from(declaration)) {
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    style[camelKey] = declaration.getPropertyValue(key).trim()
  }

  return style
}
