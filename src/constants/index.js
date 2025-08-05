// Application constants
export const APP_NAME = 'Policy Pulse'
export const APP_VERSION = '1.0.0'

// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Routes
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
}

// Theme constants
export const THEME = {
  COLORS: {
    PRIMARY: 'var(--color-brand)',
    SECONDARY: '#6b7280',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
  },
}
