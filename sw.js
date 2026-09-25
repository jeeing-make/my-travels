const CACHE_NAME = 'my-travels-v2'
const STATIC = [
  '/my-travels/',
  '/my-travels/index.html',
  '/my-travels/manifest.json'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 네트워크 우선: 항상 최신 파일을 받고, 오프라인일 때만 캐시 사용
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  // Google Maps, Supabase 등 외부 API는 건드리지 않음
  if (!e.request.url.startsWith(self.location.origin)) return

  const isPage = e.request.mode === 'navigate'
  const req = isPage ? fetch(e.request.url, { cache: 'no-cache' }) : fetch(e.request)

  e.respondWith(
    req.then(res => {
      if (res.ok) {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone))
      }
      return res
    }).catch(() =>
      caches.match(e.request).then(cached =>
        cached || (isPage ? caches.match('/my-travels/index.html') : undefined)
      )
    )
  )
})
