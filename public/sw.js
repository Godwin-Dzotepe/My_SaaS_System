self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {
    title: 'New Notification',
    body: 'You have a new update.',
    url: '/dashboard',
  };

  try {
    const parsed = event.data.json();
    payload = {
      title: parsed?.title || payload.title,
      body: parsed?.body || payload.body,
      url: parsed?.url || payload.url,
    };
  } catch {
    // Ignore parse errors and use fallback payload.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        url: payload.url,
      },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
