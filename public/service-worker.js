/*
 * ServiceWorker to make site function as a PWA (Progressive Web App)
 *
 * Based on https://glitch.com/~pwa by https://glitch.com/@PaulKinlan
 */

// Specify what we want added to the cache for offline use
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("glitch-hello-installable-cache").then((cache) => {
      return cache.addAll(["/", "/about.html", "/install.html", "/style.css", "/index.js"]);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    // Delete outdated caches if needed
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Check if the cache name doesn't match the current cache
            return cacheName !== "glitch-hello-installable-cache";
          })
          .map((cacheName) => {
            // Delete outdated cache
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// Network falling back to cache approach
self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request);
    })
  );
});

// Listen for push notifications
self.addEventListener("push", (e) => {
  const data = e.data.json();
  let promises = [];

  if ("setAppBadge" in self.navigator) {
    // this is hard-coded to "1" because getNotifications is tricky?
    const promise = self.navigator.setAppBadge(1);
    promises.push(promise);
  }

  // Promise to show a notification
  promises.push(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
    })
  );

  // Finally...
  event.waitUntil(Promise.all(promises));
});
