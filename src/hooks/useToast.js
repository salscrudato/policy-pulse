/**
 * Custom hook for managing toast notifications
 */

import { useState, useCallback, useRef } from 'react'

export const useToast = () => {
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)

  /**
   * Add a new toast notification
   */
  const addToast = useCallback((toast) => {
    const id = ++toastIdRef.current
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      position: 'top-right',
      showCloseButton: true,
      ...toast,
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  /**
   * Remove a toast notification
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  /**
   * Clear all toast notifications
   */
  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  /**
   * Show success toast
   */
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options,
    })
  }, [addToast])

  /**
   * Show error toast
   */
  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 7000, // Longer duration for errors
      ...options,
    })
  }, [addToast])

  /**
   * Show warning toast
   */
  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      ...options,
    })
  }, [addToast])

  /**
   * Show info toast
   */
  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options,
    })
  }, [addToast])

  /**
   * Show loading toast
   */
  const showLoading = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      duration: 0, // Don't auto-dismiss loading toasts
      showCloseButton: false,
      ...options,
    })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  }
}

export default useToast
