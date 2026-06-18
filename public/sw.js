// SMPL service worker — makes the app installable + offline-resilient.
// Network-first for GET (so the app shell updates), cache as fallback.
// API + non-GET always go straight to the network (never cached).
const CACHE = 'smpl-shell-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// --- web push -------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = data.title || 'SMPL'
  const jobs = [
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || undefined,
      data: { url: data.url || '/' },
    }),
  ]
  // home-screen app-icon count badge (installed PWA); no-op where unsupported
  if (typeof data.badgeCount === 'number' && self.navigator && 'setAppBadge' in self.navigator) {
    jobs.push(
      data.badgeCount > 0 ? self.navigator.setAppBadge(data.badgeCount) : self.navigator.clearAppBadge(),
    )
  }
  event.waitUntil(Promise.all(jobs))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
      for (const c of cls) {
        if ('focus' in c) {
          c.navigate?.(target)
          return c.focus()
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.origin !== location.origin) {
    return // let it hit the network normally
  }
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone()
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {})
        return resp
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/')),
      ),
  )
})
