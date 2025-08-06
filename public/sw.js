/**
 * Service Worker for PDF Summarizer PWA
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'pdf-summarizer-v1.0.0'
const STATIC_CACHE = 'pdf-summarizer-static-v1.0.0'
const DYNAMIC_CACHE = 'pdf-summarizer-dynamic-v1.0.0'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets
]

// API endpoints that can be cached
const CACHEABLE_APIS = [
  // Add any GET API endpoints that can be cached
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests (except for allowed APIs)
  if (url.origin !== location.origin && !isAllowedExternalRequest(url)) {
    return
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url)
          return cachedResponse
        }

        // Fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Cache the response
            const responseToCache = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache)
              })

            return response
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed, serving offline page', error)
            
            // Serve offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/offline.html')
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            })
          })
      })
  )
})

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'pdf-upload-retry') {
    event.waitUntil(retryFailedUploads())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event)
  
  const options = {
    body: event.data ? event.data.text() : 'PDF processing complete',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'view',
        title: 'View Summary',
        icon: '/icons/view-action.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-action.png',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification('PDF Summarizer', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event)
  
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Helper functions
function isAllowedExternalRequest(url) {
  const allowedDomains = [
    'api.openai.com',
    'cdn.jsdelivr.net',
  ]
  
  return allowedDomains.some(domain => url.hostname.includes(domain))
}

async function retryFailedUploads() {
  try {
    // Get failed uploads from IndexedDB
    const failedUploads = await getFailedUploads()
    
    for (const upload of failedUploads) {
      try {
        // Retry the upload
        const response = await fetch(upload.url, upload.options)
        
        if (response.ok) {
          // Remove from failed uploads
          await removeFailedUpload(upload.id)
          console.log('Service Worker: Retry successful for upload', upload.id)
        }
      } catch (error) {
        console.log('Service Worker: Retry failed for upload', upload.id, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to retry uploads', error)
  }
}

// IndexedDB helpers (simplified)
async function getFailedUploads() {
  // Implementation would use IndexedDB to store/retrieve failed uploads
  return []
}

async function removeFailedUpload(id) {
  // Implementation would remove the upload from IndexedDB
  console.log('Removing failed upload', id)
}
