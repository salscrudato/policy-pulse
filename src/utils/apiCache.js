/**
 * API caching and optimization utilities
 */

/**
 * Safe base64 encoding that handles Unicode characters
 * @param {string} str - String to encode
 * @returns {string} - Base64 encoded string
 */
const safeBase64Encode = (str) => {
  try {
    // First encode to UTF-8, then to base64
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16))
    }))
  } catch (error) {
    // Fallback: use a simple hash-like encoding
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

/**
 * Safe base64 decoding that handles Unicode characters
 * @param {string} str - Base64 string to decode
 * @returns {string} - Decoded string
 */
const safeBase64Decode = (str) => {
  try {
    return decodeURIComponent(atob(str).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
  } catch (error) {
    return str // Return original if decoding fails
  }
}

/**
 * Simple in-memory cache with TTL support
 */
export class APICache {
  constructor(defaultTTL = 300000) { // 5 minutes default
    this.cache = new Map()
    this.defaultTTL = defaultTTL
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000) // Cleanup every minute
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(url, options = {}) {
    const { method = 'GET', body, headers } = options
    const keyData = {
      url,
      method,
      body: body ? JSON.stringify(body) : null,
      headers: headers ? JSON.stringify(headers) : null,
    }
    return safeBase64Encode(JSON.stringify(keyData))
  }

  /**
   * Get cached response
   */
  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * Set cached response
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      created: Date.now(),
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    return this.get(key) !== null
  }

  /**
   * Delete cached item
   */
  delete(key) {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Clean up expired items
   */
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validItems = 0
    let expiredItems = 0

    for (const [, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expiredItems++
      } else {
        validItems++
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  estimateMemoryUsage() {
    let size = 0
    for (const [key, item] of this.cache.entries()) {
      size += key.length * 2 // UTF-16 characters
      size += JSON.stringify(item).length * 2
    }
    return size
  }

  /**
   * Destroy cache and cleanup
   */
  destroy() {
    clearInterval(this.cleanupInterval)
    this.clear()
  }
}

/**
 * Enhanced fetch with caching, retry, and optimization
 */
export class OptimizedFetch {
  constructor(options = {}) {
    this.cache = new APICache(options.cacheTTL)
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.timeout = options.timeout || 30000
    this.enableCache = options.enableCache !== false
  }

  /**
   * Enhanced fetch with caching and retry logic
   */
  async fetch(url, options = {}) {
    const {
      method = 'GET',
      cache: cacheOption = 'default',
      retry = this.maxRetries,
      timeout = this.timeout,
      ...fetchOptions
    } = options

    // Generate cache key
    const cacheKey = this.cache.generateKey(url, fetchOptions)

    // Check cache for GET requests
    if (this.enableCache && method === 'GET' && cacheOption !== 'no-cache') {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return this.createResponse(cached)
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    let lastError
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          method,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Cache successful GET responses
        if (this.enableCache && method === 'GET' && response.ok) {
          const responseData = await this.cloneResponse(response)
          this.cache.set(cacheKey, responseData)
        }

        return response

      } catch (error) {
        lastError = error
        
        if (attempt < retry && this.shouldRetry(error)) {
          const delay = this.calculateRetryDelay(attempt)
          await this.wait(delay)
          continue
        }
        
        break
      }
    }

    clearTimeout(timeoutId)
    throw lastError
  }

  /**
   * Clone response for caching
   */
  async cloneResponse(response) {
    const headers = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body: await response.text(),
      url: response.url,
    }
  }

  /**
   * Create response from cached data
   */
  createResponse(cachedData) {
    return new Response(cachedData.body, {
      status: cachedData.status,
      statusText: cachedData.statusText,
      headers: cachedData.headers,
    })
  }

  /**
   * Determine if error should trigger retry
   */
  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx status codes
    if (error.name === 'AbortError') return false // Don't retry timeouts
    if (error.name === 'TypeError') return true // Network error
    if (error.status >= 500) return true // Server error
    if (error.status === 429) return true // Rate limit
    return false
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    const baseDelay = this.retryDelay
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    const jitter = Math.random() * 1000 // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds
  }

  /**
   * Wait utility
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.cache.destroy()
  }
}

/**
 * Request deduplication utility
 */
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map()
  }

  /**
   * Execute request with deduplication
   */
  async execute(key, requestFn) {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    // Create new request promise
    const promise = requestFn()
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Cancel pending request
   */
  cancel(key) {
    this.pendingRequests.delete(key)
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    this.pendingRequests.clear()
  }

  /**
   * Get pending request count
   */
  getPendingCount() {
    return this.pendingRequests.size
  }
}

/**
 * API rate limiter
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }

  /**
   * Check if request is allowed
   */
  async checkLimit() {
    const now = Date.now()
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.windowMs - (now - oldestRequest)
      
      if (waitTime > 0) {
        await this.wait(waitTime)
        return this.checkLimit() // Recursive check after waiting
      }
    }

    this.requests.push(now)
    return true
  }

  /**
   * Wait utility
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get remaining requests
   */
  getRemainingRequests() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - this.requests.length)
  }
}

// Create global instances
export const apiCache = new APICache()
export const optimizedFetch = new OptimizedFetch({
  cacheTTL: 300000, // 5 minutes
  maxRetries: 3,
  timeout: 30000,
})
export const requestDeduplicator = new RequestDeduplicator()
export const rateLimiter = new RateLimiter(20, 60000) // 20 requests per minute

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    apiCache.destroy()
    optimizedFetch.destroy()
    requestDeduplicator.cancelAll()
  })
}
