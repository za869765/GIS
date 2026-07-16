/* 佳里 GIS Service Worker — v6.839
   同源實體檔案，取代舊版以 blob: URL 註冊的做法（Edge/Chrome 不支援用 blob URL 註冊 SW）。

   v6.839：Cloudflare Pages 對 *.html 做 clean-URL 308 轉址，cache.add 跟隨轉址後
   存下的 response 帶 redirected flag，而 Chrome 禁止用 redirected response 回應
   navigation request（SW 接管後開 jiali_3d.html 直接變瀏覽器錯誤頁）。
   取出時以 unredirect() 重建乾淨 Response，順便中和既有已中毒的快取項。

   快取策略（與實作一致，未擴張範圍、未做無界圖磚快取）：
   - ASSET（cache-first + 背景回填）：程式庫、本地大資料 JS、jiali_3d.html。首次造訪後可離線。
   - TILES（cache-first）：僅攔截 OpenStreetMap 標準磚（tile.openstreetmap.org / 含 '.tile.'），
     也就是「離線磚塊下載」工具預下載或地圖請求的那些 OSM 磚；離線只能命中先前載過的磚。
   注意：主頁預設底圖為 CartoDB(basemaps.cartocdn.com)，3D 頁的 OpenFreeMap 向量樣式與
   Esri 衛星影像，本 SW 都「不」攔截、不快取，仍需網路，且不違反各家圖資使用條款。

   本地資源用 new URL('檔名', self.location.href) 相對 sw.js 位置解析，
   因此同時支援 GitHub Pages 子路徑（/GIS/）與 Cloudflare Pages 根目錄（/）。 */
/* jiali_3d.html 是 cache-first 無回驗，改它必升 cache name 才會推到既有客戶端 */
const ASSET='jialie-assets-v6-data-842';
const TILES='jialie-tiles-v6';
/* 只清理本專案前綴的舊 cache；github.io 為多 repo 共用 origin，
   絕不刪除其他名稱（其他 repo/app）的 cache。 */
const OWN_CACHE_PREFIXES=['jialie-assets-','jialie-tiles-'];
const local=p=>new URL(p, self.location.href).href;
/* redirected response 不能拿來回應 navigation（Chrome 會直接顯示錯誤頁），
   以 body 重建一份乾淨 Response；非 redirected（含 opaque）原樣返回。 */
async function unredirect(r){
  if(!r || !r.redirected) return r;
  const b=await r.blob();
  return new Response(b,{status:r.status,statusText:r.statusText,headers:r.headers});
}
const PRECACHE=[
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js',
  'https://cdn.jsdelivr.net/npm/taiwan-atlas@latest/villages-10t.json',
  local('doornum_db.js'),
  local('old_addr_map.js'),
  local('land_db.js'),
  local('jiali_3d.html'),
];
self.addEventListener('install',e=>{
  self.skipWaiting();
  /* 逐項快取：任一項失敗（如 CDN 404）只記 warning，不讓整批 addAll 失敗、不阻塞 install。 */
  e.waitUntil(caches.open(ASSET).then(c=>Promise.all(
    PRECACHE.map(u=>c.add(u).catch(err=>console.warn('[GIS-SW] precache 失敗:',u,err)))
  )));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>OWN_CACHE_PREFIXES.some(pre=>k.startsWith(pre)) && k!==ASSET && k!==TILES)
      .map(k=>caches.delete(k))
  )).then(()=>clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=e.request.url;
  if(u.includes('tile.openstreetmap.org')||u.includes('.tile.')){
    e.respondWith((async()=>{
      const c=await caches.open(TILES);
      const h=await c.match(e.request);
      if(h)return h;
      try{
        const r=await fetch(e.request);
        if(r&&r.status===200){
          const clone=r.clone();
          e.waitUntil(c.put(e.request,clone));
        }
        return r;
      }catch(_){return new Response('',{status:503});}
    })());return;
  }
  if(PRECACHE.some(p=>u.startsWith(p.split('?')[0]))){
    e.respondWith((async()=>{
      /* ignoreSearch：帶 query 的 3D 連結（jiali_3d.html?lat=…）仍命中無 query 的 canonical 快取，
         不需為每組座標各存一份，離線也能開啟 3D 頁。 */
      const h=await caches.match(e.request,{ignoreSearch:true});
      if(h)return unredirect(h);
      try{
        const r=await fetch(e.request);
        if(r&&r.status===200){
          const clone=r.clone();
          e.waitUntil((async()=>{
            const c=await caches.open(ASSET);
            await c.put(e.request,await unredirect(clone));
          })());
        }
        return r;
      }catch(_){return new Response('Offline',{status:503});}
    })());return;
  }
});
