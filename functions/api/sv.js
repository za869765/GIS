// 街景代理（公開，3D 頁縮圖預覽用）。SV_KEY 存 Pages secret，不進前端與 repo。
// mode=meta → Street View metadata JSON（免費，查該點有無街景覆蓋）
// mode=img  → Street View Static 圖片（每月前 1 萬次免費，之後 $7/1000）
// 僅接受經緯度/尺寸白名單，避免被當開放代理刷 key。
const META = 'https://maps.googleapis.com/maps/api/streetview/metadata';
const IMG = 'https://maps.googleapis.com/maps/api/streetview';

function bad(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.SV_KEY) {
    return new Response(JSON.stringify({ error: 'SV_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const u = new URL(request.url);
  const mode = u.searchParams.get('mode') || 'meta';
  const location = u.searchParams.get('location') || '';
  const size = u.searchParams.get('size') || '300x180';

  if (!/^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(location)) return bad('bad location');
  const sm = size.match(/^(\d{2,3})x(\d{2,3})$/);
  if (!sm || +sm[1] > 640 || +sm[2] > 640) return bad('bad size'); // 免費層最大 640

  const qs = 'location=' + encodeURIComponent(location) + '&radius=100&key=' + env.SV_KEY;

  if (mode === 'img') {
    const r = await fetch(IMG + '?size=' + size + '&' + qs);
    return new Response(r.body, {
      status: r.status,
      headers: {
        'Content-Type': r.headers.get('Content-Type') || 'image/jpeg',
        // 同一點重看走快取，減少重複計費
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }

  const r = await fetch(META + '?' + qs);
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' }
  });
}
