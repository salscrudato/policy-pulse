/**
 * Progressive Web App utilities and service worker management
 */

/**
 * Service Worker registration and management
 */
export class ServiceWorkerManager {
  constructor() {
    this.registration = null
    this.isUpdateAvailable = false
    this.callbacks = {
      updateAvailable: [],
      updateInstalled: [],
      offline: [],
      online: [],
    }
  }

  /**
   * Register service worker
   */
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('Service Worker registered successfully')

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              this.isUpdateAvailable = true
              this.notifyCallbacks('updateAvailable', newWorker)
            } else {
              // First install
              this.notifyCallbacks('updateInstalled', newWorker)
            }
          }
        })
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event)
      })

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  /**
   * Update service worker
   */
  async update() {
    if (!this.registration) return false

    try {
      await this.registration.update()
      return true
    } catch (error) {
      console.error('Service Worker update failed:', error)
      return false
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  skipWaiting() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback)
      if (index > -1) {
        this.callbacks[event].splice(index, 1)
      }
    }
  }

  /**
   * Notify callbacks
   */
  notifyCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data))
    }
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(event) {
    const { data } = event
    
    if (data.type === 'VERSION') {
      console.log('Service Worker version:', data.version)
    }
  }

  /**
   * Get service worker version
   */
  async getVersion() {
    return new Promise((resolve) => {
      if (!this.registration || !this.registration.active) {
        resolve(null)
        return
      }

      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version)
      }

      this.registration.active.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      )
    })
  }
}

/**
 * Install prompt management
 */
export class InstallPromptManager {
  constructor() {
    this.deferredPrompt = null
    this.isInstallable = false
    this.isInstalled = false
    this.callbacks = {
      installable: [],
      installed: [],
      dismissed: [],
    }

    this.init()
  }

  /**
   * Initialize install prompt listeners
   */
  init() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      this.deferredPrompt = event
      this.isInstallable = true
      this.notifyCallbacks('installable', event)
    })

    // Listen for app installed
    window.addEventListener('appinstalled', (event) => {
      this.isInstalled = true
      this.deferredPrompt = null
      this.isInstallable = false
      this.notifyCallbacks('installed', event)
    })

    // Check if already installed
    this.checkIfInstalled()
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      return { outcome: 'not_available' }
    }

    try {
      this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'dismissed') {
        this.notifyCallbacks('dismissed', choiceResult)
      }

      this.deferredPrompt = null
      this.isInstallable = false

      return choiceResult
    } catch (error) {
      console.error('Install prompt failed:', error)
      return { outcome: 'error', error }
    }
  }

  /**
   * Check if app is installed
   */
  checkIfInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true
      return true
    }

    // Check if running as PWA on mobile
    if (window.navigator.standalone === true) {
      this.isInstalled = true
      return true
    }

    return false
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }

  /**
   * Notify callbacks
   */
  notifyCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data))
    }
  }
}

/**
 * Network status management
 */
export class NetworkManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.callbacks = {
      online: [],
      offline: [],
    }

    this.init()
  }

  /**
   * Initialize network listeners
   */
  init() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyCallbacks('online')
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyCallbacks('offline')
    })
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }

  /**
   * Notify callbacks
   */
  notifyCallbacks(event) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback())
    }
  }
}

/**
 * Background sync management
 */
export class BackgroundSyncManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
  }

  /**
   * Register background sync
   */
  async register(tag) {
    if (!this.isSupported) {
      console.log('Background Sync not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(tag)
      console.log('Background sync registered:', tag)
      return true
    } catch (error) {
      console.error('Background sync registration failed:', error)
      return false
    }
  }
}

// Create global instances
export const serviceWorkerManager = new ServiceWorkerManager()
export const installPromptManager = new InstallPromptManager()
export const networkManager = new NetworkManager()
export const backgroundSyncManager = new BackgroundSyncManager()

// Auto-register service worker
if (typeof window !== 'undefined') {
  serviceWorkerManager.register()
}
