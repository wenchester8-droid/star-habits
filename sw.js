// 离线缓存：第一次打开后，不联网也能用。改了页面就把版本号加一，用户下次联网打开时自动更新。
const CACHE = 'star-habits-v7';
const FILES = ['./', './index.html', './manifest.json', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 页面本身：联网时先取最新版（3 秒取不到就用缓存），断网用缓存
// 图标等其他文件：先用缓存，后台顺便更新
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, {ignoreSearch: true});
    const net = fetch(e.request).then(r => { if(r.ok) c.put(e.request, r.clone()); return r; });
    if(e.request.mode !== 'navigate') return hit || net.catch(() => hit);
    const timeout = new Promise(res => setTimeout(() => res(hit), 3000));
    return Promise.race([net, timeout]).then(r => r || net).catch(() => hit);
  }));
});
