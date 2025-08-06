/**
 * Enhanced loading spinner component with multiple variants
 */

import { memo } from 'react'
import { FiRotateCw, FiLoader } from 'react-icons/fi'

const LoadingSpinner = memo(({
  size = 'md',
  variant = 'spinner',
  color = 'blue',
  text = null,
  className = '',
  ...props
}) => {
  // Size configurations
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  // Color configurations
  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
  }

  // Variant configurations
  const variants = {
    spinner: {
      icon: FiRotateCw,
      animation: 'animate-spin',
    },
    loader: {
      icon: FiLoader,
      animation: 'animate-spin',
    },
    pulse: {
      icon: null,
      animation: 'animate-pulse',
    },
    bounce: {
      icon: null,
      animation: 'animate-bounce',
    },
  }

  const variantConfig = variants[variant] || variants.spinner
  const IconComponent = variantConfig.icon

  if (variant === 'pulse') {
    return (
      <div className={`inline-flex items-center ${className}`} {...props}>
        <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full ${variantConfig.animation}`} />
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    )
  }

  if (variant === 'bounce') {
    return (
      <div className={`inline-flex items-center ${className}`} {...props}>
        <div className="flex space-x-1">
          <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full ${variantConfig.animation}`} style={{ animationDelay: '0ms' }} />
          <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full ${variantConfig.animation}`} style={{ animationDelay: '150ms' }} />
          <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full ${variantConfig.animation}`} style={{ animationDelay: '300ms' }} />
        </div>
        {text && <span className="ml-3 text-sm text-gray-600">{text}</span>}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center ${className}`} {...props}>
      {IconComponent && (
        <IconComponent 
          className={`${sizeClasses[size]} ${colorClasses[color]} ${variantConfig.animation}`}
        />
      )}
      {text && (
        <span className="ml-2 text-sm text-gray-600">
          {text}
        </span>
      )}
    </div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner
