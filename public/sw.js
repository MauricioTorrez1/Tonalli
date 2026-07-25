/**
 * Offline cache for the static web build.
 *
 * Two strategies, because the two kinds of request have opposite needs:
 *
 * - Navigation requests (the HTML shell) use **network-first**: the freshest
 *   HTML always wins when online, so a new deploy's HTML — which references the
 *   new content-hashed JS/CSS — is picked up immediately, with no manual cache
 *   bump. The cached copy is the offline fallback.
 * - Everything else (content-hashed JS/CSS, icons) uses **cache-first** with a
 *   background refresh: those filenames are immutable, so serving from cache is
 *   both correct and the fastest option.
 *
 * Bumping CACHE_NAME still forces a one-time reset for everyone on next deploy.
 */
const CACHE_NAME = "tonalliblock-v5";

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

/**
 * Stores a successful response in the cache and returns the original response.
 * Non-ok responses (404s, opaque errors) are passed through without caching.
 */
function cacheAndReturn(request, response) {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  // Only http(s) responses are cacheable; browser-extension requests
  // (chrome-extension://, etc.) throw on Cache.put, so let them pass through.
  if (!request.url.startsWith("http")) {
    return;
  }

  // Network-first for navigations: a fresh deploy's HTML (and the new hashed
  // asset URLs it references) is used the moment the network is reachable.
  // Falls back to the cached route, then to the cached app shell, when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cacheAndReturn(request, response))
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached ?? caches.match("/")),
        ),
    );
    return;
  }

  // Cache-first for immutable hashed assets, refreshed in the background so the
  // next load gets any update while this load stays instant and offline-safe.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => cacheAndReturn(request, response))
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
