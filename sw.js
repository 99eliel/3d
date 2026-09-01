const CACHE_NAME='3d-runtime-v1';
const CORE=['./','./index.html','./version.json'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).catch(()=>{}));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data==='CLEAR_AND_RELOAD'){
    event.waitUntil((async()=>{
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
      await self.skipWaiting();
    })());
  }
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);

  if(url.origin!==location.origin){
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith((async()=>{
    try{
      const fresh=await fetch(request,{cache:'no-store'});
      if(fresh && fresh.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(request,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(err){
      const cached=await caches.match(request,{ignoreSearch:true});
      if(cached) return cached;
      throw err;
    }
  })());
});
