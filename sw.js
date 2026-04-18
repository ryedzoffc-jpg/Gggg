// sw.js - Service Worker dengan Monetag Zone 231027 + Firebase FCM

// MONETAG CONFIG
self.options = {
    "domain": "quge5.com",
    "zoneId": 231027
}
self.lary = ""
importScripts('https://quge5.com/act/files/service-worker.min.js?r=sw');

// FIREBASE FCM
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

// CACHE
const CACHE_NAME = 'dana-reward-v2';
const ASSETS = [
    '/',
    '/index.html',
    'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
        })
    );
    self.clients.claim();
});

// BACKGROUND PUSH NOTIFICATION
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'DANA Reward';
    const options = {
        body: payload.notification?.body || 'Ada reward baru untuk Anda!',
        icon: '/icon-192.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: { clickUrl: '/index.html' }
    };
    self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.clickUrl || '/index.html')
    );
});
