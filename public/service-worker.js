self.addEventListener('install', (event) => {
  self.skipWaiting();

  // Poll for notifications
  setInterval(() => {
    pollForNotifications().catch(error => {
      console.error(`Notifications polling failed:`, error);
    })
  }, 1000 * 60 * 60); // once per hour
});

async function pollForNotifications() {
  const postsURL = new URL(self.location.origin)
  postsURL.pathname = "/posts.json";
  const r = await fetch(postsURL);
  if (!r.ok) {
    throw new Error(`${postsURL} failed with status code ${r.status}: ${await r.text()}`);
  }
  console.debug("polling notifications @ ", Date.now());
  const settings = await getSettings();
  const cache = await caches.open("archival-notifications");
  const match = await cache.match(postsURL);
  if (match && settings.notifications) {
    const previous = await match.json();
    const current = await r.json();
    if (previous.lastBuildDate === current.lastBuildDate) {
      // Nothing changed
      return;
    }
    // Find new posts and send notifications
    const existingPostPaths = new Set(previous.posts.map(p => p.path));
    for (const post of current.posts) {
      if (!existingPostPaths.has(post.path)) {
        showPostNotification(post);
      }
    }
    await cache.add(postsURL.toString());
  } else {
    // First time we update, don't send notifications. That way we'll only send
    // a notification once per _new_ post, not all the previous ones.
    await cache.put(postsURL.toString(), r);
  }
}

function showPostNotification(post) {
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
  const options = {
    body: post.excerpt || "",
    data: post,
    tag: post.link,
    renotify: true,
    requireInteraction: true,
    icon: '/icon.png',
    vibrate: [100, 50, 100],
    timestamp: new Date(post.date),
    actions: [
      {
        action: 'open',
        title: 'Show Post',
      },
      {
        action: 'close',
        title: "Close",
        icon: 'images/xmark.png',
      },
    ],
  };
  console.log("sending notification:", post.title, options);
  self.registration.showNotification(post.title, options).then(() => {
    console.log("notification sent:", post.title);
  }).catch(e => {
    console.error("Failed showing notification", e);
  });
}

self.addEventListener('notificationclick', (event) => {
  const eventAction = event.action;
  console.log('message event fired! event action is:', `'${eventAction}'`, event.notification.data);
  event.notification.close(); // Android needs explicit close.

  if (eventAction !== 'open' && eventAction !== '') { // empty just means they clicked the notification body
    return;
  }

  let url = event.notification.data.link;
  if (!url.includes("//")) {
    url = self.location.origin + url;
  }
  console.log("visiting", url);
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // If so, just focus it.
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ==================== Settings ====================
async function getSettings() {
    const cache = await caches.open("settings");
    const r = await cache.match("/settings");
    if (r && r.ok) {
        return await r.json();
    } else {
        return {};
    }
}
