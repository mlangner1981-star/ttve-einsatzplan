// Minimaler Service Worker – nur nötig, damit Android/Chrome die App als
// installierbar erkennt ("Zum Startbildschirm hinzufügen"). Cached bewusst
// nichts von den Firebase-Daten, damit Rückmeldungen immer aktuell bleiben.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass-through: einfach normal aus dem Netz laden, kein Caching.
  event.respondWith(fetch(event.request));
});
