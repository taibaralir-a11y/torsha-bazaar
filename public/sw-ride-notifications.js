/* TORSHA BAZAAR — Ride Dispatch & Deep-Link Service Worker Handler */

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'TORSHA BAZAAR Ride Alert', body: event.data.text() };
  }

  const notif = payload.notification || payload;
  const data = payload.data || {};
  const rideId = data.rideId || notif.rideId || '';
  const portal = data.portal || 'driver';
  const title = notif.title || 'Urgent Local Ride Request';
  const body =
    notif.body ||
    'New ride request in your locality on TORSHA BAZAAR. Tap to respond before timer expires.';

  const options = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: rideId ? `torsha-ride-${rideId}` : 'torsha-ride-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [250, 120, 250, 120, 350],
    data: {
      rideId,
      portal,
      url: data.url || (rideId ? `/?portal=${encodeURIComponent(portal)}&rideId=${encodeURIComponent(rideId)}` : '/')
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || '/';
  const rideId = data.rideId || '';
  const portal = data.portal || 'driver';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'TORSHA_NAVIGATE_RIDE',
            portal,
            rideId,
            url: targetUrl
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
