/**
 * Enhanced progress bar component with animations and variants
 */

import { memo, useEffect, useState } from 'react'

const ProgressBar = memo(({
  progress = 0,
  variant = 'default',
  size = 'md',
  color = 'blue',
  showPercentage = true,
  showLabel = true,
  label = 'Progress',
  animated = true,
  striped = false,
  className = '',
  ...props
}) => {
  const [displayProgress, setDisplayProgress] = useState(0)

  // Animate progress changes
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayProgress(progress)
    }
  }, [progress, animated])

  // Size configurations
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6',
  }

  // Color configurations
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600',
  }

  // Background color configurations
  const bgColorClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    gray: 'bg-gray-100',
  }

  const progressBarClasses = [
    sizeClasses[size],
    colorClasses[color],
    'transition-all duration-300 ease-out',
    striped ? 'bg-gradient-to-r from-transparent via-white to-transparent bg-[length:20px_20px] animate-pulse' : '',
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'w-full',
    sizeClasses[size],
    bgColorClasses[color],
    'rounded-full overflow-hidden',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className="w-full" {...props}>
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-600">
              {Math.round(displayProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className={containerClasses}>
        <div
          className={progressBarClasses}
          style={{
            width: `${Math.min(Math.max(displayProgress, 0), 100)}%`,
          }}
          role="progressbar"
          aria-valuenow={displayProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  )
})

ProgressBar.displayName = 'ProgressBar'

export default ProgressBar
