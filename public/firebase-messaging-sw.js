// Firebase Cloud Messaging (FCM) Web Push Service Worker
// Chethan Kumar Portfolio - Real-Time Security & System Alerts

self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const notificationTitle = payload.notification?.title || payload.title || 'Security Center Alert';
    const notificationOptions = {
      body: payload.notification?.body || payload.body || 'A new security event occurred on your portfolio.',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: payload.data || {},
      tag: payload.tag || 'portfolio-security-alert',
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (err) {
    console.error('[SW] Push notification parsing error:', err);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/admin');
      }
    })
  );
});
