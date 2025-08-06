/**
 * Accessibility utilities and WCAG compliance helpers
 */

/**
 * Announce text to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level (polite, assertive)
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utility
 */
export class FocusManager {
  constructor() {
    this.focusStack = []
    this.trapStack = []
  }

  /**
   * Save current focus and set new focus
   * @param {Element} element - Element to focus
   */
  setFocus(element) {
    if (document.activeElement) {
      this.focusStack.push(document.activeElement)
    }
    
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  }

  /**
   * Restore previous focus
   */
  restoreFocus() {
    const previousElement = this.focusStack.pop()
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus()
    }
  }

  /**
   * Trap focus within container
   * @param {Element} container - Container element
   */
  trapFocus(container) {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    this.trapStack.push({ container, handler: handleKeyDown })

    // Focus first element
    firstElement.focus()
  }

  /**
   * Release focus trap
   * @param {Element} container - Container element
   */
  releaseFocusTrap(container) {
    const trapIndex = this.trapStack.findIndex(trap => trap.container === container)
    if (trapIndex > -1) {
      const trap = this.trapStack[trapIndex]
      container.removeEventListener('keydown', trap.handler)
      this.trapStack.splice(trapIndex, 1)
    }
  }

  /**
   * Get all focusable elements within container
   * @param {Element} container - Container element
   * @returns {Array} - Array of focusable elements
   */
  getFocusableElements(container) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               !element.hidden &&
               window.getComputedStyle(element).visibility !== 'hidden'
      })
  }
}

/**
 * Color contrast checker
 * @param {string} foreground - Foreground color (hex, rgb, etc.)
 * @param {string} background - Background color (hex, rgb, etc.)
 * @returns {object} - Contrast ratio and WCAG compliance
 */
export const checkColorContrast = (foreground, background) => {
  const getLuminance = (color) => {
    const rgb = hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  const foregroundLuminance = getLuminance(foreground)
  const backgroundLuminance = getLuminance(background)

  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  const ratio = (lighter + 0.05) / (darker + 0.05)

  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7,
    wcagAALarge: ratio >= 3,
    wcagAAALarge: ratio >= 4.5,
  }
}

/**
 * Keyboard navigation helper
 */
export class KeyboardNavigation {
  constructor(container) {
    this.container = container
    this.currentIndex = 0
    this.items = []
    this.isActive = false
  }

  /**
   * Initialize keyboard navigation
   * @param {string} itemSelector - CSS selector for navigable items
   */
  init(itemSelector) {
    this.items = Array.from(this.container.querySelectorAll(itemSelector))
    this.bindEvents()
    this.isActive = true
  }

  /**
   * Bind keyboard events
   */
  bindEvents() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    if (!this.isActive || this.items.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        this.moveNext()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        this.movePrevious()
        break
      case 'Home':
        e.preventDefault()
        this.moveToFirst()
        break
      case 'End':
        e.preventDefault()
        this.moveToLast()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        this.activateItem()
        break
    }
  }

  /**
   * Move to next item
   */
  moveNext() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length
    this.focusCurrentItem()
  }

  /**
   * Move to previous item
   */
  movePrevious() {
    this.currentIndex = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1
    this.focusCurrentItem()
  }

  /**
   * Move to first item
   */
  moveToFirst() {
    this.currentIndex = 0
    this.focusCurrentItem()
  }

  /**
   * Move to last item
   */
  moveToLast() {
    this.currentIndex = this.items.length - 1
    this.focusCurrentItem()
  }

  /**
   * Focus current item
   */
  focusCurrentItem() {
    const item = this.items[this.currentIndex]
    if (item) {
      item.focus()
      item.scrollIntoView({ block: 'nearest' })
    }
  }

  /**
   * Activate current item
   */
  activateItem() {
    const item = this.items[this.currentIndex]
    if (item) {
      item.click()
    }
  }

  /**
   * Destroy keyboard navigation
   */
  destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown)
    this.isActive = false
  }
}

/**
 * ARIA live region manager
 */
export class LiveRegionManager {
  constructor() {
    this.regions = new Map()
    this.createDefaultRegions()
  }

  /**
   * Create default live regions
   */
  createDefaultRegions() {
    this.createRegion('polite', 'polite')
    this.createRegion('assertive', 'assertive')
    this.createRegion('status', 'polite', 'status')
  }

  /**
   * Create live region
   * @param {string} id - Region ID
   * @param {string} politeness - Politeness level
   * @param {string} role - ARIA role
   */
  createRegion(id, politeness = 'polite', role = null) {
    if (this.regions.has(id)) return

    const region = document.createElement('div')
    region.id = `live-region-${id}`
    region.setAttribute('aria-live', politeness)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    
    if (role) {
      region.setAttribute('role', role)
    }

    document.body.appendChild(region)
    this.regions.set(id, region)
  }

  /**
   * Announce message to live region
   * @param {string} message - Message to announce
   * @param {string} regionId - Region ID
   */
  announce(message, regionId = 'polite') {
    const region = this.regions.get(regionId)
    if (!region) return

    // Clear previous message
    region.textContent = ''
    
    // Set new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      region.textContent = message
    }, 100)

    // Clear message after announcement
    setTimeout(() => {
      region.textContent = ''
    }, 5000)
  }

  /**
   * Update status
   * @param {string} status - Status message
   */
  updateStatus(status) {
    this.announce(status, 'status')
  }

  /**
   * Announce error
   * @param {string} error - Error message
   */
  announceError(error) {
    this.announce(`Error: ${error}`, 'assertive')
  }

  /**
   * Announce success
   * @param {string} message - Success message
   */
  announceSuccess(message) {
    this.announce(`Success: ${message}`, 'polite')
  }

  /**
   * Cleanup live regions
   */
  cleanup() {
    this.regions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region)
      }
    })
    this.regions.clear()
  }
}

// Create global instances
export const focusManager = new FocusManager()
export const liveRegionManager = new LiveRegionManager()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    liveRegionManager.cleanup()
  })
}

/**
 * Screen reader only CSS class
 */
export const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`

// Inject screen reader styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = srOnlyStyles
  document.head.appendChild(style)
}
