/**
 * Service Worker for El Rayan Website
 * Handles caching of static assets for offline access and faster loading
 */

const CACHE_NAME = 'elrayan-cache-v1';
const STATIC_CACHE = 'elrayan-static-v1';
const DYNAMIC_CACHE = 'elrayan-dynamic-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/css/styles.css',
  './assets/images/logo.png',
  './assets/images/background.jpg',
  './assets/js/cache-manager.js'
];

// External CDN resources to cache
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.rtl.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap',
  'https://unpkg.com/aos@2.3.1/dist/aos.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js',
  'https://unpkg.com/aos@2.3.1/dist/aos.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache CDN assets
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('Service Worker: Caching CDN assets');
        return Promise.allSettled(
          CDN_ASSETS.map(url => 
            fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) {
                  cache.put(url, response);
                }
              })
              .catch(err => console.log('Failed to cache:', url))
          )
        );
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => {
            console.log('Service Worker: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('Service Worker: Serving from cache:', request.url);
        
        // Update cache in background (stale-while-revalidate)
        event.waitUntil(
          fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                const cacheName = url.origin === location.origin ? STATIC_CACHE : DYNAMIC_CACHE;
                caches.open(cacheName).then(cache => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {}) // Ignore network errors for background update
        );
        
        return cachedResponse;
      }
      
      // Not in cache, fetch from network
      return fetch(request)
        .then(networkResponse => {
          // Cache successful responses
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            const cacheName = url.origin === location.origin ? STATIC_CACHE : DYNAMIC_CACHE;
            
            caches.open(cacheName).then(cache => {
              cache.put(request, responseClone);
            });
          }
          
          return networkResponse;
        })
        .catch(error => {
          console.log('Service Worker: Fetch failed:', error);
          
          // Return offline fallback for HTML pages
          if (request.headers.get('Accept').includes('text/html')) {
            return caches.match('./index.html');
          }
          
          throw error;
        });
    })
  );
});

// Message event - handle cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'UPDATE_VERSION') {
    // Force update by clearing all caches
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(name => caches.delete(name))
        ).then(() => {
          // Re-cache static assets
          return caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS));
        });
      })
    );
  }
});
