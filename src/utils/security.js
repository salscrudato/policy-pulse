/**
 * Security utilities and configurations for PDF Summarizer
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
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    'https://cdn.jsdelivr.net', // For PDF.js worker
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
  ],
  'img-src': [
    "'self'",
    'data:', // For base64 images
    'blob:', // For generated images
  ],
  'font-src': [
    "'self'",
    'data:',
  ],
  'connect-src': [
    "'self'",
    'https://api.openai.com', // OpenAI API
  ],
  'worker-src': [
    "'self'",
    'blob:', // For Web Workers
    'https://cdn.jsdelivr.net', // For PDF.js worker
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
}

/**
 * Generate CSP header string
 */
export const generateCSPHeader = () => {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return ''

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove JavaScript protocols
    .replace(/javascript:/gi, '')
    // Remove data URLs
    .replace(/data:[^;]*;base64,[^"']*/gi, '')
    // Remove potential script content
    .replace(/on\w+\s*=/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Validate file upload security
 * @param {File} file - File to validate
 * @returns {object} - Validation result
 */
export const validateFileUpload = (file) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  if (!file) {
    result.isValid = false
    result.errors.push('No file provided')
    return result
  }

  // Check file type
  const allowedTypes = ['application/pdf']
  if (!allowedTypes.includes(file.type)) {
    result.isValid = false
    result.errors.push('Invalid file type. Only PDF files are allowed.')
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    result.isValid = false
    result.errors.push(`File size too large. Maximum size is ${maxSize / 1024 / 1024}MB.`)
  }

  // Check minimum file size (1KB)
  const minSize = 1024
  if (file.size < minSize) {
    result.isValid = false
    result.errors.push('File appears to be empty or corrupted.')
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.scr$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i,
  ]

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    result.isValid = false
    result.errors.push('Suspicious file name detected.')
  }

  // Check for double extensions
  if ((file.name.match(/\./g) || []).length > 1) {
    result.warnings.push('File has multiple extensions. Please verify this is a legitimate PDF file.')
  }

  return result
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }

  /**
   * Check if request is allowed
   * @param {string} identifier - Unique identifier (IP, user ID, etc.)
   * @returns {boolean} - Whether request is allowed
   */
  isAllowed(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    )

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return true
  }

  /**
   * Get remaining requests for identifier
   * @param {string} identifier - Unique identifier
   * @returns {number} - Remaining requests
   */
  getRemainingRequests(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    )

    return Math.max(0, this.maxRequests - validRequests.length)
  }

  /**
   * Get time until next request is allowed
   * @param {string} identifier - Unique identifier
   * @returns {number} - Milliseconds until next request
   */
  getTimeUntilReset(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    
    if (userRequests.length === 0) return 0

    const oldestRequest = Math.min(...userRequests)
    const resetTime = oldestRequest + this.windowMs

    return Math.max(0, resetTime - now)
  }
}

/**
 * Environment variable validation
 */
export const validateEnvironment = () => {
  const issues = []

  // Check for required environment variables
  if (import.meta.env.PROD && !import.meta.env.VITE_OPENAI_API_KEY) {
    issues.push({
      level: 'error',
      message: 'VITE_OPENAI_API_KEY is required in production',
    })
  }

  // Check for development-only variables in production
  if (import.meta.env.PROD) {
    const devOnlyVars = ['VITE_DEBUG', 'VITE_MOCK_API']
    devOnlyVars.forEach(varName => {
      if (import.meta.env[varName]) {
        issues.push({
          level: 'warning',
          message: `${varName} should not be set in production`,
        })
      }
    })
  }

  // Check for insecure configurations
  if (import.meta.env.VITE_OPENAI_API_KEY && 
      import.meta.env.VITE_OPENAI_API_KEY.startsWith('sk-') &&
      import.meta.env.DEV) {
    issues.push({
      level: 'warning',
      message: 'OpenAI API key detected in development. Ensure it\'s not committed to version control.',
    })
  }

  return issues
}

/**
 * Secure random string generator
 * @param {number} length - Length of random string
 * @returns {string} - Secure random string
 */
export const generateSecureRandomString = (length = 32) => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Simple encryption/decryption for client-side data
 * Note: This is for obfuscation only, not true security
 */
export class SimpleEncryption {
  constructor(key = null) {
    this.key = key || generateSecureRandomString(16)
  }

  /**
   * Simple XOR encryption (for obfuscation only)
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted text (base64)
   */
  encrypt(text) {
    const encrypted = []
    for (let i = 0; i < text.length; i++) {
      const keyChar = this.key.charCodeAt(i % this.key.length)
      const textChar = text.charCodeAt(i)
      encrypted.push(String.fromCharCode(textChar ^ keyChar))
    }
    return safeBase64Encode(encrypted.join(''))
  }

  /**
   * Simple XOR decryption
   * @param {string} encryptedText - Encrypted text (base64)
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedText) {
    try {
      const encrypted = safeBase64Decode(encryptedText)
      const decrypted = []
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = this.key.charCodeAt(i % this.key.length)
        const encryptedChar = encrypted.charCodeAt(i)
        decrypted.push(String.fromCharCode(encryptedChar ^ keyChar))
      }
      return decrypted.join('')
    } catch (error) {
      throw new Error('Failed to decrypt data')
    }
  }
}

/**
 * Security headers for development server
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Create rate limiter instances
export const apiRateLimiter = new RateLimiter(20, 60000) // 20 requests per minute
export const uploadRateLimiter = new RateLimiter(5, 60000) // 5 uploads per minute

// Create encryption instance
export const clientEncryption = new SimpleEncryption()
