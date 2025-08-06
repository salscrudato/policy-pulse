/**
 * Performance optimization utilities for PDF Summarizer
 */

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = []
  }

  /**
   * Start timing an operation
   * @param {string} name - Operation name
   * @returns {string} - Timer ID
   */
  startTimer(name) {
    const timerId = `${name}_${Date.now()}_${Math.random()}`
    this.metrics.set(timerId, {
      name,
      startTime: performance.now(),
      startMemory: this.getMemoryUsage(),
    })
    return timerId
  }

  /**
   * End timing an operation
   * @param {string} timerId - Timer ID from startTimer
   * @returns {object} - Performance metrics
   */
  endTimer(timerId) {
    const metric = this.metrics.get(timerId)
    if (!metric) {
      console.warn(`Timer ${timerId} not found`)
      return null
    }

    const endTime = performance.now()
    const endMemory = this.getMemoryUsage()
    
    const result = {
      name: metric.name,
      duration: endTime - metric.startTime,
      memoryDelta: endMemory - metric.startMemory,
      startMemory: metric.startMemory,
      endMemory,
    }

    this.metrics.delete(timerId)
    this.notifyObservers(result)
    
    return result
  }

  /**
   * Get current memory usage
   * @returns {number} - Memory usage in MB
   */
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1024 / 1024
    }
    return 0
  }

  /**
   * Add performance observer
   * @param {Function} callback - Observer callback
   */
  addObserver(callback) {
    this.observers.push(callback)
  }

  /**
   * Remove performance observer
   * @param {Function} callback - Observer callback
   */
  removeObserver(callback) {
    const index = this.observers.indexOf(callback)
    if (index > -1) {
      this.observers.splice(index, 1)
    }
  }

  /**
   * Notify all observers
   * @param {object} metric - Performance metric
   */
  notifyObservers(metric) {
    this.observers.forEach(callback => {
      try {
        callback(metric)
      } catch (error) {
        console.error('Performance observer error:', error)
      }
    })
  }

  /**
   * Get performance summary
   * @returns {object} - Performance summary
   */
  getSummary() {
    return {
      currentMemory: this.getMemoryUsage(),
      activeTimers: this.metrics.size,
      observerCount: this.observers.length,
    }
  }
}

/**
 * Debounce utility for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

/**
 * Throttle utility for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Lazy loading utility for components
 * @param {Function} importFunc - Dynamic import function
 * @param {object} options - Loading options
 * @returns {React.Component} - Lazy component
 */
export const createLazyComponent = (importFunc, options = {}) => {
  const { 
    fallback = null, 
    retryCount = 3, 
    retryDelay = 1000 
  } = options

  return React.lazy(async () => {
    let lastError
    
    for (let i = 0; i < retryCount; i++) {
      try {
        return await importFunc()
      } catch (error) {
        lastError = error
        console.warn(`Lazy loading attempt ${i + 1} failed:`, error)
        
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
        }
      }
    }
    
    throw lastError
  })
}

/**
 * Memory cleanup utility
 */
export class MemoryManager {
  constructor() {
    this.cleanupTasks = new Set()
    this.intervals = new Set()
    this.timeouts = new Set()
    this.eventListeners = new Map()
  }

  /**
   * Register cleanup task
   * @param {Function} task - Cleanup task
   */
  registerCleanup(task) {
    this.cleanupTasks.add(task)
  }

  /**
   * Register interval for cleanup
   * @param {number} intervalId - Interval ID
   */
  registerInterval(intervalId) {
    this.intervals.add(intervalId)
  }

  /**
   * Register timeout for cleanup
   * @param {number} timeoutId - Timeout ID
   */
  registerTimeout(timeoutId) {
    this.timeouts.add(timeoutId)
  }

  /**
   * Register event listener for cleanup
   * @param {Element} element - DOM element
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  registerEventListener(element, event, listener) {
    const key = `${element}_${event}`
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, [])
    }
    this.eventListeners.get(key).push({ element, event, listener })
  }

  /**
   * Clean up all registered resources
   */
  cleanup() {
    // Run cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task()
      } catch (error) {
        console.error('Cleanup task error:', error)
      }
    })

    // Clear intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId))

    // Clear timeouts
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId))

    // Remove event listeners
    this.eventListeners.forEach(listeners => {
      listeners.forEach(({ element, event, listener }) => {
        try {
          element.removeEventListener(event, listener)
        } catch (error) {
          console.error('Event listener cleanup error:', error)
        }
      })
    })

    // Clear all collections
    this.cleanupTasks.clear()
    this.intervals.clear()
    this.timeouts.clear()
    this.eventListeners.clear()
  }
}

/**
 * Bundle size analyzer utility
 */
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  
  const analysis = {
    scripts: scripts.map(script => ({
      src: script.src,
      async: script.async,
      defer: script.defer,
    })),
    styles: styles.map(style => ({
      href: style.href,
      media: style.media,
    })),
    totalScripts: scripts.length,
    totalStyles: styles.length,
  }

  console.table(analysis.scripts)
  console.table(analysis.styles)
  
  return analysis
}

/**
 * Image optimization utility
 * @param {string} src - Image source
 * @param {object} options - Optimization options
 * @returns {Promise<string>} - Optimized image URL
 */
export const optimizeImage = async (src, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        blob => {
          const url = URL.createObjectURL(blob)
          resolve(url)
        },
        `image/${format}`,
        quality
      )
    }
    
    img.onerror = reject
    img.src = src
  })
}

/**
 * Virtual scrolling utility for large lists
 */
export class VirtualScroller {
  constructor(container, itemHeight, renderItem) {
    this.container = container
    this.itemHeight = itemHeight
    this.renderItem = renderItem
    this.items = []
    this.visibleStart = 0
    this.visibleEnd = 0
    this.scrollTop = 0
    
    this.setupScrollListener()
  }

  /**
   * Set items to display
   * @param {Array} items - Items array
   */
  setItems(items) {
    this.items = items
    this.updateVisibleRange()
    this.render()
  }

  /**
   * Setup scroll event listener
   */
  setupScrollListener() {
    const throttledScroll = throttle(() => {
      this.scrollTop = this.container.scrollTop
      this.updateVisibleRange()
      this.render()
    }, 16) // ~60fps

    this.container.addEventListener('scroll', throttledScroll)
  }

  /**
   * Update visible range based on scroll position
   */
  updateVisibleRange() {
    const containerHeight = this.container.clientHeight
    const totalHeight = this.items.length * this.itemHeight
    
    this.visibleStart = Math.floor(this.scrollTop / this.itemHeight)
    this.visibleEnd = Math.min(
      this.items.length,
      this.visibleStart + Math.ceil(containerHeight / this.itemHeight) + 1
    )
  }

  /**
   * Render visible items
   */
  render() {
    const fragment = document.createDocumentFragment()
    
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.items[i]
      const element = this.renderItem(item, i)
      element.style.position = 'absolute'
      element.style.top = `${i * this.itemHeight}px`
      element.style.height = `${this.itemHeight}px`
      fragment.appendChild(element)
    }
    
    this.container.innerHTML = ''
    this.container.appendChild(fragment)
    this.container.style.height = `${this.items.length * this.itemHeight}px`
  }
}

// Create global instances
export const performanceMonitor = new PerformanceMonitor()
export const memoryManager = new MemoryManager()

// Performance logging in development
if (import.meta.env.DEV) {
  performanceMonitor.addObserver((metric) => {
    if (metric.duration > 100) { // Log slow operations
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`)
    }
  })
}
