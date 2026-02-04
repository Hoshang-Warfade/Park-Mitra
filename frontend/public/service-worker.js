/* eslint-disable no-restricted-globals */
/**
 * Service Worker for ParkMitra PWA
 * Provides offline capabilities and caching for Progressive Web App features
 * 
 * Note: This is optional and requires registration in index.js
 * To enable PWA features, register this service worker in src/index.js
 */

// Cache version - increment to force cache refresh
const CACHE_NAME = 'parkmitra-v1';

// Assets to cache on install
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/favicon.ico'
];

/**
 * Install Event - Cache static assets
 * Triggered when service worker is first installed
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 * Triggered when service worker becomes active
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event - Network first, then cache fallback strategy
 * Intercepts all fetch requests and provides offline support
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip API requests (always fetch fresh)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return offline message for API requests
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'You are offline. Please check your connection.' 
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }
  
  // Network first, cache fallback for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response as it can only be consumed once
        const responseToCache = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return cachedResponse;
          }
          
          // No cache available, return offline page
          return caches.match('/index.html');
        });
      })
  );
});

/**
 * Message Event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[Service Worker] Cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * Push Event - Handle push notifications (future feature)
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ParkMitra', options)
  );
});

/**
 * Notification Click Event - Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[Service Worker] Loaded');
