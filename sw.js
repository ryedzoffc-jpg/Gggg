// ==================== MONETAG CONFIGURATION ====================
// Zone 1: 3nbf4.com - 10892764
self.options = {
    "domain": "3nbf4.com",
    "zoneId": 10892764
}
self.lary = ""

// Import Monetag service worker utama
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');

// ==================== MONETAG ZONE 2 ====================
// Zone 2: al5sm.com - 10892791 (dual monetization)
self.options2 = {
    "domain": "al5sm.com",
    "zoneId": 10892791
}

// Import service worker kedua jika diperlukan
try {
    importScripts('https://al5sm.com/act/files/service-worker.min.js?r=sw');
} catch(e) {
    console.log('[SW] Zone 2 worker optional:', e);
}

// ==================== FIREBASE CONFIGURATION ====================
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDlJwwL4qGleoiJ65vwfzmYyZ1OWDygnhw",
    authDomain: "draznews.firebaseapp.com",
    databaseURL: "https://draznews-default-rtdb.firebaseio.com",
    projectId: "draznews",
    storageBucket: "draznews.firebasestorage.app",
    messagingSenderId: "169063075153",
    appId: "1:169063075153:web:b3cd52d3f34d768dafd770",
    measurementId: "G-2P48317DPY"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ==================== CACHE MANAGEMENT ====================
const CACHE_NAME = 'leviathan-dana-v6';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching assets');
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(err => console.log('[SW] Cache error:', err))
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== 'workbox-precache-v2') {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache first
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
                return new Response('Offline - Tidak ada koneksi', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});

// ==================== FIREBASE BACKGROUND PUSH NOTIFICATION ====================
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'DANA4D Alert';
    const notificationOptions = {
        body: payload.notification?.body || 'Klik iklan untuk klaim saldo DANA',
        icon: '/icon-192.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            clickUrl: payload.data?.clickUrl || '/index.html',
            timestamp: Date.now()
        },
        actions: [
            { action: 'open', title: 'Buka Sekarang' },
            { action: 'close', title: 'Tutup' }
        ]
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.clickUrl || '/index.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Message from client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Cache cleared');
        });
    }
});

// ==================== MONETAG DUAL ZONE SYNC ====================
// Sinkronisasi kedua zone Monetag
self.addEventListener('sync', (event) => {
    if (event.tag === 'monetag-sync') {
        event.waitUntil(
            Promise.all([
                fetch('https://3nbf4.com/act/sync').catch(() => {}),
                fetch('https://al5sm.com/act/sync').catch(() => {})
            ])
        );
    }
});

// Optional: Periodic sync untuk update iklan
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-ads') {
        event.waitUntil(
            Promise.all([
                fetch('https://3nbf4.com/act/ping').catch(() => {}),
                fetch('https://al5sm.com/act/ping').catch(() => {})
            ])
        );
    }
});

console.log('[SW] Leviathan Service Worker Online - Dual Zone Monetag + Firebase');
