/**
 * Minimal offline cache for the static web build. No precomputed asset
 * manifest — Metro's JS/CSS filenames are content-hashed per build, so
 * instead this caches whatever it actually sees fetched, then serves cache
 * first (fast, works offline) while refreshing the cache from the network in
 * the background for next time. Bump CACHE_NAME to force everyone's cache to
 * reset on the next deploy.
 */
const CACHE_NAME = "tonalliblock-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
