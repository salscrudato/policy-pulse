/**
 * Enhanced error handling utilities for Policy Pulse
 */

/**
 * Safely encode text for logging to prevent btoa errors
 * @param {string} text - Text to encode
 * @returns {string} - Safe encoded text
 */
const safeEncodeForLogging = (text) => {
  if (!text || typeof text !== 'string') return ''

  try {
    // Remove problematic characters and normalize
    const cleanText = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .normalize('NFKC') // Normalize Unicode
      .substring(0, 1000) // Limit length for logging

    return cleanText
  } catch (error) {
    // Fallback: keep only basic ASCII characters
    return text.replace(/[^\x20-\x7E]/g, '').substring(0, 1000)
  }
}

/**
 * Custom error classes for different types of errors
 */
export class PDFProcessingError extends Error {
  constructor(message, cause = null) {
    super(message)
    this.name = 'PDFProcessingError'
    this.cause = cause
    this.timestamp = new Date().toISOString()
  }
}

export class AIServiceError extends Error {
  constructor(message, statusCode = null, cause = null) {
    super(message)
    this.name = 'AIServiceError'
    this.statusCode = statusCode
    this.cause = cause
    this.timestamp = new Date().toISOString()
  }
}

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Error handler with retry logic
 * @param {Function} operation - Operation to execute
 * @param {object} options - Retry options
 * @returns {Promise<any>} - Operation result
 */
export const withRetry = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = (error) => true
  } = options

  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }
      
      const waitTime = delay * Math.pow(backoff, attempt)
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${waitTime}ms:`, error.message)
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError
}

/**
 * Wraps async operations with comprehensive error handling
 * @param {Function} operation - Async operation to wrap
 * @param {object} options - Error handling options
 * @returns {Function} - Wrapped operation
 */
export const withErrorHandling = (operation, options = {}) => {
  const {
    onError = null,
    fallback = null,
    timeout = 30000,
    context = 'Operation'
  } = options

  return async (...args) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${context} timed out after ${timeout}ms`)), timeout)
    })

    try {
      const result = await Promise.race([operation(...args), timeoutPromise])
      return result
    } catch (error) {
      const enhancedError = enhanceError(error, context)
      
      if (onError) {
        onError(enhancedError)
      }
      
      if (fallback) {
        console.warn(`${context} failed, using fallback:`, enhancedError.message)
        return fallback
      }
      
      throw enhancedError
    }
  }
}

/**
 * Enhances error with additional context and debugging information
 * @param {Error} error - Original error
 * @param {string} context - Context where error occurred
 * @returns {Error} - Enhanced error
 */
export const enhanceError = (error, context = 'Unknown') => {
  const enhanced = new Error(`[${context}] ${error.message}`)
  enhanced.name = error.name
  enhanced.stack = error.stack
  enhanced.originalError = error
  enhanced.context = context
  enhanced.timestamp = new Date().toISOString()
  enhanced.userAgent = navigator.userAgent
  enhanced.url = window.location.href
  
  return enhanced
}

/**
 * Logs errors with structured information
 * @param {Error} error - Error to log
 * @param {object} additionalInfo - Additional context
 */
export const logError = (error, additionalInfo = {}) => {
  try {
    // Safely process additional info to prevent encoding errors
    const safeAdditionalInfo = {}
    for (const [key, value] of Object.entries(additionalInfo)) {
      if (typeof value === 'string') {
        safeAdditionalInfo[key] = safeEncodeForLogging(value)
      } else {
        safeAdditionalInfo[key] = value
      }
    }

    const errorInfo = {
      message: safeEncodeForLogging(error.message || 'Unknown error'),
      name: error.name || 'Error',
      stack: safeEncodeForLogging(error.stack || ''),
      timestamp: new Date().toISOString(),
      context: error.context || 'Unknown',
      ...safeAdditionalInfo
    }

    console.error('Error logged:', errorInfo)

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorTrackingService(errorInfo)
    }
  } catch (loggingError) {
    // Fallback logging if the main logging fails
    console.error('Failed to log error:', loggingError)
    console.error('Original error:', error.message || error)
  }
}

/**
 * Creates user-friendly error messages
 * @param {Error} error - Error to format
 * @returns {string} - User-friendly message
 */
export const formatErrorForUser = (error) => {
  if (error instanceof PDFProcessingError) {
    return 'There was an issue processing your PDF file. Please ensure it\'s a valid PDF and try again.'
  }
  
  if (error instanceof AIServiceError) {
    if (error.statusCode === 401) {
      return 'API authentication failed. Please check your API key configuration.'
    }
    if (error.statusCode === 429) {
      return 'API rate limit exceeded. Please wait a moment and try again.'
    }
    if (error.statusCode >= 500) {
      return 'The AI service is temporarily unavailable. Please try again later.'
    }
    return 'There was an issue with the AI analysis. Please try again.'
  }
  
  if (error instanceof ValidationError) {
    return `Validation error: ${error.message}`
  }
  
  if (error.message.includes('timeout')) {
    return 'The operation took too long to complete. Please try with a smaller file or try again later.'
  }
  
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.'
  }
  
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
}

/**
 * Validates file before processing
 * @param {File} file - File to validate
 * @throws {ValidationError} - If file is invalid
 */
export const validateFile = (file) => {
  if (!file) {
    throw new ValidationError('No file provided')
  }
  
  if (file.type !== 'application/pdf') {
    throw new ValidationError('File must be a PDF', 'fileType')
  }
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new ValidationError(`File size must be less than ${maxSize / 1024 / 1024}MB`, 'fileSize')
  }
  
  const minSize = 1024 // 1KB
  if (file.size < minSize) {
    throw new ValidationError('File appears to be empty or corrupted', 'fileSize')
  }
}

/**
 * Handles API errors with specific logic for different status codes
 * @param {Response} response - Fetch response
 * @throws {AIServiceError} - Appropriate error based on status
 */
export const handleAPIError = async (response) => {
  let errorMessage = 'Unknown API error'
  
  try {
    const errorData = await response.json()
    errorMessage = errorData.error?.message || errorData.message || errorMessage
  } catch {
    errorMessage = response.statusText || errorMessage
  }
  
  throw new AIServiceError(errorMessage, response.status)
}

/**
 * Safe JSON parsing with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} - Parsed object or fallback
 */
export const safeJSONParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('JSON parsing failed:', error.message)
    return fallback
  }
}

/**
 * Enhanced error recovery strategies
 */
export class ErrorRecoveryManager {
  constructor() {
    this.recoveryStrategies = new Map()
    this.errorHistory = []
    this.maxHistorySize = 100
  }

  registerStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy)
  }

  async handleError(error, context = {}) {
    this.recordError(error, context)

    const strategy = this.getRecoveryStrategy(error)
    if (strategy) {
      try {
        return await strategy(error, context, this.getErrorPattern(error))
      } catch (recoveryError) {
        console.warn('Recovery strategy failed:', recoveryError)
        throw error // Throw original error if recovery fails
      }
    }

    throw error
  }

  getRecoveryStrategy(error) {
    // Try exact match first
    if (this.recoveryStrategies.has(error.constructor.name)) {
      return this.recoveryStrategies.get(error.constructor.name)
    }

    // Try parent class matches
    if (error instanceof AIServiceError && this.recoveryStrategies.has('AIServiceError')) {
      return this.recoveryStrategies.get('AIServiceError')
    }

    if (error instanceof PDFProcessingError && this.recoveryStrategies.has('PDFProcessingError')) {
      return this.recoveryStrategies.get('PDFProcessingError')
    }

    // Generic strategy
    return this.recoveryStrategies.get('default')
  }

  recordError(error, context) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      type: error.constructor.name,
      message: error.message,
      context,
      stack: error.stack
    }

    this.errorHistory.unshift(errorRecord)

    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }
  }

  getErrorPattern(error) {
    const recentErrors = this.errorHistory.slice(0, 10)
    const sameTypeErrors = recentErrors.filter(e => e.type === error.constructor.name)

    return {
      frequency: sameTypeErrors.length,
      isRecurring: sameTypeErrors.length > 2,
      lastOccurrence: sameTypeErrors[0]?.timestamp,
      pattern: this.analyzeErrorPattern(sameTypeErrors)
    }
  }

  analyzeErrorPattern(errors) {
    if (errors.length < 2) return 'isolated'

    const timeGaps = []
    for (let i = 1; i < errors.length; i++) {
      const gap = new Date(errors[i-1].timestamp) - new Date(errors[i].timestamp)
      timeGaps.push(gap)
    }

    const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length

    if (avgGap < 5000) return 'rapid_succession'
    if (avgGap < 60000) return 'frequent'
    return 'periodic'
  }

  getErrorSummary() {
    const summary = {
      totalErrors: this.errorHistory.length,
      errorTypes: {},
      recentErrors: this.errorHistory.slice(0, 5)
    }

    this.errorHistory.forEach(error => {
      summary.errorTypes[error.type] = (summary.errorTypes[error.type] || 0) + 1
    })

    return summary
  }
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.resetTimeout = options.resetTimeout || 60000
    this.monitoringPeriod = options.monitoringPeriod || 300000 // 5 minutes

    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0
    this.lastFailureTime = null
    this.successCount = 0
    this.requestHistory = []
  }

  async execute(operation, context = {}) {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN'
        this.successCount = 0
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await operation(context)
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  onSuccess() {
    this.recordRequest(true)

    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= 3) { // Require 3 successes to close
        this.reset()
      }
    } else {
      this.failureCount = Math.max(0, this.failureCount - 1) // Gradually reduce failure count
    }
  }

  onFailure(error) {
    this.recordRequest(false)
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      console.warn(`Circuit breaker opened due to ${this.failureCount} failures`)
    }
  }

  shouldAttemptReset() {
    return Date.now() - this.lastFailureTime >= this.resetTimeout
  }

  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    console.info('Circuit breaker reset to CLOSED state')
  }

  recordRequest(success) {
    const now = Date.now()
    this.requestHistory.push({ timestamp: now, success })

    // Clean old records
    this.requestHistory = this.requestHistory.filter(
      record => now - record.timestamp <= this.monitoringPeriod
    )
  }

  getStats() {
    const now = Date.now()
    const recentRequests = this.requestHistory.filter(
      record => now - record.timestamp <= this.monitoringPeriod
    )

    const totalRequests = recentRequests.length
    const successfulRequests = recentRequests.filter(r => r.success).length
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0

    return {
      state: this.state,
      failureCount: this.failureCount,
      successRate: Math.round(successRate * 100),
      totalRequests,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// Export instances
export const errorRecoveryManager = new ErrorRecoveryManager()
export const apiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000
})
