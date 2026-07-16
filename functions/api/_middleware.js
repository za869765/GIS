// 對 /api/* 做 PIN 驗證；以下 path 不需要驗證
const PUBLIC = new Set(['/api/login', '/api/logout', '/api/me', '/api/overlay', '/api/sv']);

export async function onRequest(context) {
  const { request, env, next } = context;
  const path = new URL(request.url).pathname;

  if (PUBLIC.has(path)) return next();

  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/admin_pin=([^;]+)/);
  const pin = m ? decodeURIComponent(m[1]) : '';
  if (pin !== env.ADMIN_PIN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return next();
}
