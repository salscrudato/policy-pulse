/**
 * Responsive design utilities and breakpoint management
 */

import { useState, useEffect } from 'react'

/**
 * Breakpoint definitions following Tailwind CSS conventions
 */
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

/**
 * Device type detection
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
  LARGE_DESKTOP: 'large-desktop',
}

/**
 * Get current device type based on screen width
 * @returns {string} Device type
 */
export const getDeviceType = () => {
  const width = window.innerWidth

  if (width < BREAKPOINTS.md) return DEVICE_TYPES.MOBILE
  if (width < BREAKPOINTS.lg) return DEVICE_TYPES.TABLET
  if (width < BREAKPOINTS.xl) return DEVICE_TYPES.DESKTOP
  return DEVICE_TYPES.LARGE_DESKTOP
}

/**
 * Check if current viewport matches breakpoint
 * @param {string} breakpoint - Breakpoint name
 * @param {string} direction - 'up' or 'down'
 * @returns {boolean}
 */
export const matchesBreakpoint = (breakpoint, direction = 'up') => {
  const width = window.innerWidth
  const breakpointValue = BREAKPOINTS[breakpoint]

  if (!breakpointValue) return false

  return direction === 'up' ? width >= breakpointValue : width < breakpointValue
}

/**
 * Responsive hook for React components
 */
export const useResponsive = () => {
  const [deviceType, setDeviceType] = useState(getDeviceType())
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      const newDeviceType = getDeviceType()
      const newScreenSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      }

      setDeviceType(newDeviceType)
      setScreenSize(newScreenSize)
    }

    // Debounce resize events
    const debouncedResize = debounce(handleResize, 150)
    window.addEventListener('resize', debouncedResize)

    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [])

  return {
    deviceType,
    screenSize,
    isMobile: deviceType === DEVICE_TYPES.MOBILE,
    isTablet: deviceType === DEVICE_TYPES.TABLET,
    isDesktop: deviceType === DEVICE_TYPES.DESKTOP,
    isLargeDesktop: deviceType === DEVICE_TYPES.LARGE_DESKTOP,
    isSmallScreen: matchesBreakpoint('md', 'down'),
    isLargeScreen: matchesBreakpoint('lg', 'up'),
  }
}

/**
 * Responsive image utility
 * @param {string} baseSrc - Base image source
 * @param {object} sizes - Size variants
 * @returns {object} Responsive image props
 */
export const getResponsiveImageProps = (baseSrc, sizes = {}) => {
  const {
    mobile = baseSrc,
    tablet = baseSrc,
    desktop = baseSrc,
    alt = '',
    loading = 'lazy',
  } = sizes

  const deviceType = getDeviceType()
  
  let src = baseSrc
  switch (deviceType) {
    case DEVICE_TYPES.MOBILE:
      src = mobile
      break
    case DEVICE_TYPES.TABLET:
      src = tablet
      break
    default:
      src = desktop
  }

  return {
    src,
    alt,
    loading,
    srcSet: `${mobile} 480w, ${tablet} 768w, ${desktop} 1024w`,
    sizes: '(max-width: 768px) 480px, (max-width: 1024px) 768px, 1024px',
  }
}

/**
 * Responsive text utility
 * @param {object} textSizes - Text sizes for different breakpoints
 * @returns {string} CSS class string
 */
export const getResponsiveTextClass = (textSizes) => {
  const {
    base = 'text-base',
    sm = null,
    md = null,
    lg = null,
    xl = null,
  } = textSizes

  const classes = [base]
  
  if (sm) classes.push(`sm:${sm}`)
  if (md) classes.push(`md:${md}`)
  if (lg) classes.push(`lg:${lg}`)
  if (xl) classes.push(`xl:${xl}`)

  return classes.join(' ')
}

/**
 * Responsive spacing utility
 * @param {object} spacing - Spacing values for different breakpoints
 * @returns {string} CSS class string
 */
export const getResponsiveSpacingClass = (spacing) => {
  const {
    base = '',
    sm = null,
    md = null,
    lg = null,
    xl = null,
  } = spacing

  const classes = base ? [base] : []
  
  if (sm) classes.push(`sm:${sm}`)
  if (md) classes.push(`md:${md}`)
  if (lg) classes.push(`lg:${lg}`)
  if (xl) classes.push(`xl:${xl}`)

  return classes.join(' ')
}

/**
 * Touch device detection
 * @returns {boolean} True if touch device
 */
export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Orientation detection
 * @returns {string} 'portrait' or 'landscape'
 */
export const getOrientation = () => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
}

/**
 * Safe area utilities for mobile devices
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement)
  
  return {
    top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
    right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
    bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
    left: style.getPropertyValue('env(safe-area-inset-left)') || '0px',
  }
}

/**
 * Responsive container utility
 * @param {string} size - Container size (sm, md, lg, xl, 2xl, full)
 * @returns {string} CSS class string
 */
export const getResponsiveContainer = (size = 'lg') => {
  const containerClasses = {
    sm: 'max-w-sm mx-auto px-4',
    md: 'max-w-md mx-auto px-4',
    lg: 'max-w-4xl mx-auto px-4',
    xl: 'max-w-6xl mx-auto px-4',
    '2xl': 'max-w-7xl mx-auto px-4',
    full: 'w-full px-4',
  }

  return containerClasses[size] || containerClasses.lg
}

/**
 * Responsive grid utility
 * @param {object} columns - Column counts for different breakpoints
 * @returns {string} CSS class string
 */
export const getResponsiveGrid = (columns) => {
  const {
    base = 1,
    sm = null,
    md = null,
    lg = null,
    xl = null,
  } = columns

  const classes = [`grid-cols-${base}`]
  
  if (sm) classes.push(`sm:grid-cols-${sm}`)
  if (md) classes.push(`md:grid-cols-${md}`)
  if (lg) classes.push(`lg:grid-cols-${lg}`)
  if (xl) classes.push(`xl:grid-cols-${xl}`)

  return `grid ${classes.join(' ')}`
}

/**
 * Responsive visibility utility
 * @param {object} visibility - Visibility settings for breakpoints
 * @returns {string} CSS class string
 */
export const getResponsiveVisibility = (visibility) => {
  const {
    hideOnMobile = false,
    hideOnTablet = false,
    hideOnDesktop = false,
    showOnlyMobile = false,
    showOnlyDesktop = false,
  } = visibility

  const classes = []

  if (hideOnMobile) classes.push('hidden sm:block')
  if (hideOnTablet) classes.push('sm:hidden lg:block')
  if (hideOnDesktop) classes.push('lg:hidden')
  if (showOnlyMobile) classes.push('sm:hidden')
  if (showOnlyDesktop) classes.push('hidden lg:block')

  return classes.join(' ')
}

/**
 * Debounce utility for performance
 */
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Export responsive utilities as a collection
export const ResponsiveUtils = {
  getDeviceType,
  matchesBreakpoint,
  getResponsiveImageProps,
  getResponsiveTextClass,
  getResponsiveSpacingClass,
  getResponsiveContainer,
  getResponsiveGrid,
  getResponsiveVisibility,
  isTouchDevice,
  getOrientation,
  getSafeAreaInsets,
}
