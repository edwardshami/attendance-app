self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network first, no cache strategy to ensure fresh data
    event.respondWith(
        fetch(event.request, { cache: 'no-store' }).catch(() => {
            return new Response('Network error occurred');
        })
    );
});