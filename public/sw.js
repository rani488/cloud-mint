const CACHE='cloudmint-v2';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  const cacheOk=(r)=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(cc=>cc.put(e.request,c))}return r};
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(cacheOk).catch(()=>caches.match(e.request)));
  }else{
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(cacheOk)));
  }
});
