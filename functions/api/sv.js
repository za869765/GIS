// 街景代理（公開，3D 頁縮圖預覽用）。SV_KEY 存 Pages secret，不進前端與 repo。
// mode=meta → Street View metadata JSON（免費，查該點有無街景覆蓋、取得 pano_id）
// mode=img  → Street View Static 圖片（每月前 1 萬次免費，之後 $7/1000）
//   img 優先用 pano=<pano_id>（同一顆全景球不論點哪裡 URL 都相同 → 快取命中率高），
//   搭配 Cloudflare 邊緣快取 30 天：同 pano+heading+size 全體使用者只計費一次。
// 防護：僅同源頁面可呼叫（Referer / Sec-Fetch-Site），參數白名單防開放代理盜刷。
const META = 'https://maps.googleapis.com/maps/api/streetview/metadata';
const IMG = 'https://maps.googleapis.com/maps/api/streetview';

function bad(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status: status || 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.SV_KEY) return bad('SV_KEY not configured', 500);

  const u = new URL(request.url);

  // 同源防護：瀏覽器同源子資源必帶 Referer（或 Sec-Fetch-Site: same-origin），
  // curl / 外站盜連兩者皆無 → 403。隱私工具剝掉 Referer 時 Sec-Fetch-Site 仍在。
  const ref = request.headers.get('Referer') || '';
  const sfs = request.headers.get('Sec-Fetch-Site') || '';
  if (!ref.startsWith(u.origin + '/') && sfs !== 'same-origin') {
    return bad('forbidden', 403);
  }

  const mode = u.searchParams.get('mode') || 'meta';

  // 互動式街景（Maps Embed API，免費無限次）用的前端 key。
  // 該 key 在 GCP 以 referrer 限制 gis-2bh.pages.dev + 僅允許 Embed API，公開無風險；
  // 存 secret 只是避免進 repo 與方便輪替。未設定時回空字串，前端退回靜態放大圖。
  if (mode === 'embedkey') {
    return new Response(JSON.stringify({ key: env.SV_EMBED_KEY || '' }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
    });
  }

  const location = u.searchParams.get('location') || '';
  const pano = u.searchParams.get('pano') || '';
  const heading = u.searchParams.get('heading') || '';
  const size = u.searchParams.get('size') || '300x180';

  if (pano) {
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(pano)) return bad('bad pano');
  } else if (!/^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(location)) {
    return bad('bad location');
  }
  if (heading !== '' && !/^\d{1,3}$/.test(heading)) return bad('bad heading');
  const sm = size.match(/^(\d{2,3})x(\d{2,3})$/);
  if (!sm || +sm[1] > 640 || +sm[2] > 640) return bad('bad size'); // 免費層最大 640

  const target = pano
    ? 'pano=' + encodeURIComponent(pano)
    : 'location=' + encodeURIComponent(location) + '&radius=100';
  const headingQ = heading !== '' ? '&heading=' + heading : '';

  if (mode === 'img') {
    // 邊緣快取：以去除無關 header 的正規化 URL 當 key，全體使用者共享
    const cache = caches.default;
    const cacheKey = new Request(u.origin + u.pathname +
      '?mode=img&size=' + size + '&' + target + headingQ);
    const hit = await cache.match(cacheKey);
    if (hit) return hit;

    const r = await fetch(IMG + '?size=' + size + '&' + target + headingQ + '&key=' + env.SV_KEY);
    const res = new Response(r.body, {
      status: r.status,
      headers: {
        'Content-Type': r.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000' // 30 天：街景影像極少變動
      }
    });
    if (r.status === 200) context.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  }

  const r = await fetch(META + '?' + target + headingQ + '&key=' + env.SV_KEY);
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' }
  });
}
