// POST /api/import/:name
// Body: { format: 'csv'|'json', data: <string|array>, mode: 'replace'|'append' }
//   format=csv: data 是 CSV 字串（第一列為 header，必須含 pk）
//   format=json: data 是物件陣列
//   mode=replace: INSERT OR REPLACE (預設)；同 pk 覆蓋
//   mode=append: INSERT；同 pk 衝突會錯 (回報失敗筆數)

const TABLES = {
  old_to_new: {
    pk: 'old_addr',
    cols: ['old_addr', 'new_addr', 'notes'],
    required: ['old_addr', 'new_addr']
  },
  door_db: {
    pk: 'addr', // door_db 用 addr 做 UNIQUE 來判重 (id 是 auto)
    cols: ['lat', 'lng', 'addr', 'notes'],
    required: ['lat', 'lng', 'addr'],
    numCols: ['lat', 'lng']
  },
  village_info: {
    pk: 'village',
    cols: ['village', 'head', 'phone', 'address', 'service_area', 'population', 'notes', 'extra'],
    required: ['village'],
    numCols: ['population']
  },
  kv_misc: {
    pk: 'key',
    cols: ['key', 'category', 'value', 'notes'],
    required: ['key']
  }
};

export async function onRequestPost({ env, params, request }) {
  const t = TABLES[params.name];
  if (!t) return json({ error: 'unknown table' }, 404);

  const body = await request.json().catch(() => ({}));
  const format = body.format || 'csv';
  const mode = body.mode === 'append' ? 'append' : 'replace';
  const verb = mode === 'replace' ? 'INSERT OR REPLACE' : 'INSERT';

  let rows;
  try {
    rows = format === 'csv' ? parseCsv(String(body.data || '')) : (Array.isArray(body.data) ? body.data : []);
  } catch (e) {
    return json({ error: 'parse error: ' + e.message }, 400);
  }
  if (!rows.length) return json({ error: 'no rows' }, 400);

  // 過濾 + 型別轉換 + 必填欄位檢查
  const cleaned = [];
  const errors = [];
  rows.forEach((row, idx) => {
    const obj = {};
    for (const c of t.cols) {
      if (c in row && row[c] !== '' && row[c] !== null && row[c] !== undefined) {
        obj[c] = (t.numCols || []).includes(c) ? Number(row[c]) : String(row[c]);
      }
    }
    const missing = t.required.filter(c => !(c in obj));
    if (missing.length) {
      errors.push({ row: idx + 1, missing });
    } else {
      cleaned.push(obj);
    }
  });

  if (!cleaned.length) {
    return json({ error: 'all rows invalid', errors }, 400);
  }

  // 批次寫入 (200 筆/批，避免單一 statement 過大)
  let inserted = 0;
  const failed = [];
  const BATCH = 200;
  for (let i = 0; i < cleaned.length; i += BATCH) {
    const batch = cleaned.slice(i, i + BATCH);
    const stmts = batch.map(obj => {
      const cols = Object.keys(obj);
      const sql = `${verb} INTO ${params.name} (${cols.join(',')}, source, updated_at)
                   VALUES (${cols.map(() => '?').join(',')}, 'admin', datetime('now'))`;
      return env.DB.prepare(sql).bind(...cols.map(c => obj[c]));
    });
    try {
      const results = await env.DB.batch(stmts);
      inserted += results.reduce((n, r) => n + (r.meta?.changes || 0), 0);
    } catch (e) {
      failed.push({ batch_start: i + 1, error: e.message });
    }
  }

  await audit(env, 'IMPORT', params.name, `${inserted}rows`, { mode, total: cleaned.length, inserted });
  return json({
    ok: true,
    total_in: rows.length,
    inserted,
    parse_errors: errors,
    batch_errors: failed
  });
}

// 簡易 CSV parser：支援雙引號內含逗號跟雙引號（""）；不支援多行 cell。
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.length);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = cells[i] !== undefined ? cells[i] : ''; });
    return obj;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = false;
      } else cur += ch;
    } else {
      if (ch === ',') { out.push(cur); cur = ''; }
      else if (ch === '"' && cur === '') inQuote = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
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
