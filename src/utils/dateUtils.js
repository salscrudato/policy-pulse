/**
 * Date utility functions
 */

/**
 * Formats a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, locale = 'en-US') => {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formats a date to include time
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted date and time string
 */
export const formatDateTime = (date, locale = 'en-US') => {
  const dateObj = new Date(date)
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Gets relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = date => {
  const now = new Date()
  const dateObj = new Date(date)
  const diffInSeconds = Math.floor((now - dateObj) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
}

/**
 * Checks if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = date => {
  const today = new Date()
  const dateObj = new Date(date)

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}
