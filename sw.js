const CACHE_NAME = 'mini-games-cache-v1';
const PRECACHE_URLS = [
    './',
    'index.html',
    'home.html',
    'style.css',
    'upload/audio/bgm_piano.mp3',
    'upload/img/card_fruit.png',
    'upload/img/card_balloon.png',
    'upload/img/card_cat.png',
    'upload/img/card_ants.png',
    'upload/img/bubble_pop_thumbnail.png',
    'upload/img/card_puzzle.png'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(PRECACHE_URLS);
            })
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event: Serve from cache, fall back to network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Strategy for media assets (images, audio): Cache First
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|mp3|wav|ogg)$/i)) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
        );
    } else {
        // Strategy for other files (HTML, JS, CSS): Network First (to get latest updates)
        // Fallback to cache if offline
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});
