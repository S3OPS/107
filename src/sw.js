/**
 * Service Worker for DxD Academy PWA
 * Provides offline caching for questions and assets
 * @version 1.0.0
 */

const CACHE_NAME = 'dxd-academy-v1';
const CACHE_URLS = [
    '/src/index.html',
    '/src/style.css',
    '/src/game.js',
    '/src/modules/config.js',
    '/src/modules/state.js',
    '/src/modules/quiz.js',
    '/src/modules/ui.js',
    '/data/questions.json',
    '/assets/images/rias_neutral.png',
    '/assets/images/akeno_weather.png',
    '/assets/images/koneko_loading.png',
    '/assets/audio/audio.wav'
];

/**
 * Install event - cache all static assets
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.error('[SW] Cache install failed:', err);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 * Uses cache-first strategy for better offline experience
 */
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Don't cache if not a valid response
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // Clone the response for caching
                        const responseToCache = networkResponse.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed, try to return offline fallback
                        if (event.request.destination === 'document') {
                            return caches.match('/src/index.html');
                        }
                        return null;
                    });
            })
    );
});

/**
 * Message event - handle cache update requests
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
