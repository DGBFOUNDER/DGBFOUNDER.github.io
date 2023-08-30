self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("DGB").then(cache => {
      return cache.addAll(["/", "/about.html", "/install.html", "/style.css", "/index.js"]);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== "DGB")
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

self.addEventListener("push", e => {
  const data = e.data.json();
  const promises = [];

  if ("setAppBadge" in self.navigator) {
    promises.push(self.navigator.setAppBadge(1));
  }

  promises.push(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
    })
  );

  e.waitUntil(Promise.all(promises));
});
