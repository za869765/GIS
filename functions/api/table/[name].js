// GET /api/table/:name  — list with search/filter/pagination
// POST /api/table/:name — create one row (forced source='admin')

const TABLES = {
  old_to_new: {
    pk: 'old_addr',
    cols: ['old_addr', 'new_addr', 'notes'],
    likeCols: ['old_addr', 'new_addr', 'notes']
  },
  door_db: {
    pk: 'id',
    cols: ['lat', 'lng', 'addr', 'notes'],
    likeCols: ['addr', 'notes']
  },
  village_info: {
    pk: 'village',
    cols: ['village', 'head', 'phone', 'address', 'service_area', 'population', 'notes', 'extra'],
    likeCols: ['village', 'head', 'phone', 'address', 'service_area', 'notes']
  },
  kv_misc: {
    pk: 'key',
    cols: ['key', 'category', 'value', 'notes'],
    likeCols: ['key', 'category', 'value', 'notes']
  }
};

export async function onRequestGet({ env, params, request }) {
  const t = TABLES[params.name];
  if (!t) return json({ error: 'unknown table' }, 404);

  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const source = url.searchParams.get('source');
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 500);
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  const orderBy = ['updated_at', 'source', t.pk].includes(url.searchParams.get('order_by'))
    ? url.searchParams.get('order_by') : 'updated_at';
  const orderDir = url.searchParams.get('order_dir') === 'asc' ? 'ASC' : 'DESC';

  const where = [];
  const binds = [];
  if (q) {
    where.push('(' + t.likeCols.map(c => `${c} LIKE ?`).join(' OR ') + ')');
    t.likeCols.forEach(() => binds.push(`%${q}%`));
  }
  if (source === 'admin' || source === 'seed') {
    where.push('source = ?');
    binds.push(source);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const listSql = `SELECT * FROM ${params.name} ${whereSql} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS c FROM ${params.name} ${whereSql}`;

  const [rowsRes, countRes] = await Promise.all([
    env.DB.prepare(listSql).bind(...binds, limit, offset).all(),
    env.DB.prepare(countSql).bind(...binds).first()
  ]);
  return json({ rows: rowsRes.results, total: countRes.c, limit, offset });
}

export async function onRequestPost({ env, params, request }) {
  const t = TABLES[params.name];
  if (!t) return json({ error: 'unknown table' }, 404);
  const body = await request.json().catch(() => ({}));

  const cols = t.cols.filter(c => c in body && body[c] !== undefined && body[c] !== null);
  if (!cols.length) return json({ error: 'no fields supplied' }, 400);

  const sql = `INSERT OR REPLACE INTO ${params.name} (${cols.join(',')}, source, updated_at)
               VALUES (${cols.map(() => '?').join(',')}, 'admin', datetime('now'))`;
  const binds = cols.map(c => body[c]);
  try {
    const res = await env.DB.prepare(sql).bind(...binds).run();
    await audit(env, 'INSERT', params.name, body[t.pk] || String(res.meta.last_row_id), body);
    return json({ ok: true, id: res.meta.last_row_id || body[t.pk] });
  } catch (e) {
    return json({ error: e.message }, 400);
  }
}

async function audit(env, action, table, key, detail) {
  try {
    await env.DB.prepare(
      'INSERT INTO audit_log (action, table_name, row_key, detail) VALUES (?,?,?,?)'
    ).bind(action, table, String(key || ''), JSON.stringify(detail).slice(0, 4000)).run();
  } catch (_) {}
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
