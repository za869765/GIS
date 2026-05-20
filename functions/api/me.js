export async function onRequestGet({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/admin_pin=([^;]+)/);
  const pin = m ? decodeURIComponent(m[1]) : '';
  return new Response(
    JSON.stringify({ authenticated: pin === env.ADMIN_PIN }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
