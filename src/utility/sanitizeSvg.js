import createDOMPurify from 'dompurify'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const LOCAL_REFERENCE = /^#[^\s"'<>]+$/
const STYLE_PROPERTIES = new Set(`
  fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap
  stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity
  stop-color stop-opacity flood-color flood-opacity lighting-color color
  color-interpolation color-interpolation-filters color-rendering shape-rendering
  text-rendering image-rendering vector-effect paint-order clip-path clip-rule
  mask mask-type filter marker-start marker-mid marker-end display visibility
  transform transform-origin transform-box font-family font-size font-style
  font-weight font-stretch font-variant font-variant-ligatures font-feature-settings
  text-anchor text-decoration text-align dominant-baseline alignment-baseline
  baseline-shift letter-spacing word-spacing line-height white-space writing-mode
  direction unicode-bidi overflow isolation mix-blend-mode
`.trim().split(/\s+/))

// Only literal local paint/filter references are supported. Reject CSS escapes,
// comments and indirection so alternate URL spellings cannot bypass this policy.
function hasSafeCssValue(value) {
  if (/[\\@]|\/\*|var\s*\(|env\s*\(|attr\s*\(|expression\s*\(/i.test(value)) return false
  const remainder = value.replace(/url\(\s*(['"]?)(#[^\s"'()<>]+)\1\s*\)/gi, '')
  return !/url\s*\(/i.test(remainder)
}

export function sanitizeSvg(svgText) {
  if (typeof svgText !== 'string' || !svgText.trim()) {
    throw new Error('Choose a non-empty SVG file.')
  }
  // XML validation is intentionally stricter than svgson's tolerant parser.
  // Do not resolve DTD entities or external XML resources.
  if (/<!DOCTYPE|<!ENTITY/i.test(svgText)) {
    throw new Error('SVG document types and entities are unsupported. Export as plain SVG.')
  }
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = document.documentElement
  if (document.querySelector('parsererror') || root.nodeName !== 'svg' ||
    (root.namespaceURI && root.namespaceURI !== SVG_NAMESPACE)) {
    throw new Error('Invalid SVG. Choose a well-formed file with an SVG root.')
  }
  if (!root.namespaceURI) root.setAttribute('xmlns', SVG_NAMESPACE)

  const warnings = new Set()
  const purify = createDOMPurify(window)
  purify.addHook('uponSanitizeAttribute', (node, data) => {
    const name = data.attrName
    const value = data.attrValue
    if (name === 'href' || name === 'xlink:href') {
      if (!LOCAL_REFERENCE.test(value.trim())) {
        data.keepAttr = false
        warnings.add('External resources and non-local links were removed.')
      }
    } else if (name === 'style') {
      const declaration = document.createElementNS(SVG_NAMESPACE, 'g').style
      declaration.cssText = value
      for (const property of Array.from(declaration)) {
        if (!STYLE_PROPERTIES.has(property) || !hasSafeCssValue(declaration.getPropertyValue(property))) {
          declaration.removeProperty(property)
          warnings.add('Unsupported or unsafe styles were removed.')
        }
      }
      // React style objects cannot represent !important; retain the value.
      for (const property of Array.from(declaration)) {
        if (declaration.getPropertyPriority(property)) {
          declaration.setProperty(property, declaration.getPropertyValue(property))
          warnings.add('Inline !important priorities were removed.')
        }
      }
      data.attrValue = declaration.cssText
    } else if (name === 'xml:base' || name === 'src' ||
      (name.startsWith('xmlns:') && name !== 'xmlns:xlink') ||
      !hasSafeCssValue(value)) {
      data.keepAttr = false
    }
  })

  const clean = purify.sanitize(new XMLSerializer().serializeToString(root), {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
    FORBID_TAGS: ['script', 'style', 'foreignObject', 'image', 'feImage', 'a',
      'animate', 'animateMotion', 'animateTransform', 'set', 'discard', 'metadata'],
    FORBID_ATTR: ['xml:base'],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM: false
  })
  // The SVG-only profile also removes its own temporary HTML body wrapper.
  if (purify.removed.some(item => item.attribute || item.element?.nodeName !== 'BODY')) {
    warnings.add('Unsafe or unsupported SVG content and editor metadata were removed.')
  }
  return { source: clean, warnings: [...warnings] }
}
