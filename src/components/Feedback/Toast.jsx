/**
 * Toast notification component with multiple variants and animations
 */

import { memo, useEffect, useState } from 'react'
import { FiCheck, FiX, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi'

const Toast = memo(({
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-right',
  showCloseButton = true,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  // Auto-dismiss timer
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300) // Animation duration
  }

  if (!isVisible) return null

  // Type configurations
  const typeConfigs = {
    success: {
      icon: FiCheck,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700',
    },
    error: {
      icon: FiX,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
    },
    warning: {
      icon: FiAlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
    },
    info: {
      icon: FiInfo,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
    },
  }

  // Position configurations
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  }

  const config = typeConfigs[type] || typeConfigs.info
  const IconComponent = config.icon

  const toastClasses = [
    'fixed z-50 max-w-sm w-full',
    positionClasses[position],
    config.bgColor,
    config.borderColor,
    'border rounded-lg shadow-lg p-4',
    'transition-all duration-300 ease-in-out',
    isExiting ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={toastClasses} {...props}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h4 className={`text-sm font-medium ${config.titleColor} mb-1`}>
              {title}
            </h4>
          )}
          {message && (
            <p className={`text-sm ${config.messageColor}`}>
              {message}
            </p>
          )}
        </div>

        {showCloseButton && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md p-1.5 ${config.iconColor} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors`}
              aria-label="Close notification"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div
            className={`h-1 rounded-full ${config.iconColor.replace('text-', 'bg-')}`}
            style={{
              animation: `shrink ${duration}ms linear`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
})

Toast.displayName = 'Toast'

export default Toast
