// GET    /api/table/:name/:id — fetch single row
// PUT    /api/table/:name/:id — update (forced source='admin')
// DELETE /api/table/:name/:id — delete

const TABLES = {
  old_to_new: {
    pk: 'old_addr',
    cols: ['old_addr', 'new_addr', 'notes']
  },
  door_db: {
    pk: 'id',
    cols: ['lat', 'lng', 'addr', 'notes']
  },
  village_info: {
    pk: 'village',
    cols: ['village', 'head', 'phone', 'address', 'service_area', 'population', 'notes', 'extra']
  },
  kv_misc: {
    pk: 'key',
    cols: ['key', 'category', 'value', 'notes']
  }
};

export async function onRequestGet({ env, params }) {
  const t = TABLES[params.name];
  if (!t) return json({ error: 'unknown table' }, 404);
  const id = params.id;
  const row = await env.DB.prepare(
    `SELECT * FROM ${params.name} WHERE ${t.pk} = ?`
  ).bind(id).first();
  if (!row) {
    // debug: 回傳 id 的 codepoints + DB 內 source='admin' 的 id 列表
    const codepoints = [...id].map(c => c.codePointAt(0).toString(16)).join(' ');
    const sample = await env.DB.prepare(
      `SELECT ${t.pk} AS k FROM ${params.name} WHERE source='admin' LIMIT 5`
    ).all();
    return json({
      error: 'not found',
      debug: {
        params_id: id,
        params_id_codepoints: codepoints,
        params_id_length: id.length,
        sample_admin_keys: sample.results.map(r => r.k)
      }
    }, 404);
  }
  return json(row);
}

export async function onRequestPut({ env, params, request }) {
  const t = TABLES[params.name];
  if (!t) return json({ error: 'unknown table' }, 404);
  const id = params.id;
  const body = await request.json().catch(() => ({}));

  const updatable = t.cols.filter(c => c in body && c !== t.pk);
  if (!updatable.length) return json({ error: 'no fields to update' }, 400);

  const sets = updatable.map(c => `${c} = ?`).concat(["source = 'admin'", "updated_at = datetime('now')"]).join(', ');
  const sql = `UPDATE ${params.name} SET ${sets} WHERE ${t.pk} = ?`;
  const binds = [...updatable.map(c => body[c]), id];

  try {
    const res = await env.DB.prepare(sql).bind(...binds).run();
    if (res.meta.changes === 0) return json({ error: 'not found' }, 404);
    await audit(env, 'UPDATE', params.name, id, body);
    return json({ ok: true, changes: res.meta.changes });
  } catch (e) {
    return json({ error: e.message }, 400);
  }
}

export async function onRequestDelete({ env, params }) {
  const t = TABLES[params.name];
  if (!t) return json({ error: 'unknown table' }, 404);
  const id = params.id;
  try {
    const res = await env.DB.prepare(
      `DELETE FROM ${params.name} WHERE ${t.pk} = ?`
    ).bind(id).run();
    if (res.meta.changes === 0) return json({ error: 'not found' }, 404);
    await audit(env, 'DELETE', params.name, id, null);
    return json({ ok: true, changes: res.meta.changes });
  } catch (e) {
    return json({ error: e.message }, 400);
  }
}

async function audit(env, action, table, key, detail) {
  try {
    await env.DB.prepare(
      'INSERT INTO audit_log (action, table_name, row_key, detail) VALUES (?,?,?,?)'
    ).bind(action, table, String(key || ''), detail ? JSON.stringify(detail).slice(0, 4000) : null).run();
  } catch (_) {}
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
