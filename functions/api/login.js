export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin || '');
  if (pin !== env.ADMIN_PIN) {
    return json({ error: 'invalid pin' }, 401);
  }
  const headers = new Headers({ 'Content-Type': 'application/json' });
  // 12 小時 session cookie
  headers.append(
    'Set-Cookie',
    `admin_pin=${encodeURIComponent(pin)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`
  );
  return new Response(JSON.stringify({ ok: true }), { headers });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
