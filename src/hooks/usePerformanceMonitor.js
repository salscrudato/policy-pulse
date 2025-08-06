/**
 * Custom hook for performance monitoring and memory management
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { performanceMonitor, memoryManager } from '../utils/performance'

export const usePerformanceMonitor = (componentName) => {
  const timersRef = useRef(new Map())
  const cleanupRef = useRef(new Set())

  /**
   * Start timing an operation
   */
  const startTimer = useCallback((operationName) => {
    const fullName = `${componentName}.${operationName}`
    const timerId = performanceMonitor.startTimer(fullName)
    timersRef.current.set(operationName, timerId)
    return timerId
  }, [componentName])

  /**
   * End timing an operation
   */
  const endTimer = useCallback((operationName) => {
    const timerId = timersRef.current.get(operationName)
    if (timerId) {
      const result = performanceMonitor.endTimer(timerId)
      timersRef.current.delete(operationName)
      return result
    }
    return null
  }, [])

  /**
   * Register cleanup function
   */
  const registerCleanup = useCallback((cleanupFn) => {
    cleanupRef.current.add(cleanupFn)
    memoryManager.registerCleanup(cleanupFn)
  }, [])

  /**
   * Register interval for cleanup
   */
  const registerInterval = useCallback((intervalId) => {
    memoryManager.registerInterval(intervalId)
  }, [])

  /**
   * Register timeout for cleanup
   */
  const registerTimeout = useCallback((timeoutId) => {
    memoryManager.registerTimeout(timeoutId)
  }, [])

  /**
   * Get current memory usage
   */
  const getMemoryUsage = useCallback(() => {
    return performanceMonitor.getMemoryUsage()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // End any remaining timers
      timersRef.current.forEach((timerId, operationName) => {
        performanceMonitor.endTimer(timerId)
      })
      timersRef.current.clear()

      // Run cleanup functions
      cleanupRef.current.forEach(cleanupFn => {
        try {
          cleanupFn()
        } catch (error) {
          console.error(`Cleanup error in ${componentName}:`, error)
        }
      })
      cleanupRef.current.clear()
    }
  }, [componentName])

  return {
    startTimer,
    endTimer,
    registerCleanup,
    registerInterval,
    registerTimeout,
    getMemoryUsage,
  }
}

/**
 * Hook for monitoring component render performance
 */
export const useRenderPerformance = (componentName, dependencies = []) => {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef(0)

  useEffect(() => {
    renderCountRef.current += 1
    const now = performance.now()
    
    if (lastRenderTimeRef.current > 0) {
      const timeSinceLastRender = now - lastRenderTimeRef.current
      
      // Log slow renders in development
      if (import.meta.env.DEV && timeSinceLastRender > 16) {
        console.warn(
          `Slow render detected in ${componentName}: ${timeSinceLastRender.toFixed(2)}ms (render #${renderCountRef.current})`
        )
      }
    }
    
    lastRenderTimeRef.current = now
  }, dependencies)

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
  }
}

/**
 * Hook for debouncing values to improve performance
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for throttling function calls
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now())

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args)
      lastRun.current = Date.now()
    }
  }, [callback, delay])
}

/**
 * Hook for managing async operations with cleanup
 */
export const useAsyncOperation = () => {
  const mountedRef = useRef(true)
  const operationsRef = useRef(new Set())

  /**
   * Execute async operation with automatic cleanup
   */
  const executeAsync = useCallback(async (asyncFn, onSuccess, onError) => {
    const operationId = Symbol('async-operation')
    operationsRef.current.add(operationId)

    try {
      const result = await asyncFn()
      
      // Only proceed if component is still mounted and operation wasn't cancelled
      if (mountedRef.current && operationsRef.current.has(operationId)) {
        onSuccess?.(result)
      }
      
      return result
    } catch (error) {
      // Only handle error if component is still mounted and operation wasn't cancelled
      if (mountedRef.current && operationsRef.current.has(operationId)) {
        onError?.(error)
      }
      throw error
    } finally {
      operationsRef.current.delete(operationId)
    }
  }, [])

  /**
   * Cancel all pending operations
   */
  const cancelOperations = useCallback(() => {
    operationsRef.current.clear()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      operationsRef.current.clear()
    }
  }, [])

  return {
    executeAsync,
    cancelOperations,
    hasPendingOperations: operationsRef.current.size > 0,
  }
}

/**
 * Hook for intersection observer (lazy loading, infinite scroll)
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
      observer.disconnect()
    }
  }, [hasIntersected, options])

  return {
    targetRef,
    isIntersecting,
    hasIntersected,
  }
}

/**
 * Hook for managing local storage with performance optimization
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      // Use requestIdleCallback for non-critical localStorage writes
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        })
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

export default usePerformanceMonitor
