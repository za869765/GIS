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
    cols: ['village', 'nurse', 'head_name', 'tel', 'mobile', 'address',
           'pop_total', 'pop_male', 'pop_female', 'pop_young', 'pop_adult', 'pop_old',
           'ab_total', 'ab_plain', 'ab_mountain', 'prev_care', 'notes'],
    required: ['village'],
    numCols: ['pop_total', 'pop_male', 'pop_female', 'pop_young', 'pop_adult', 'pop_old',
              'ab_total', 'ab_plain', 'ab_mountain']
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
  const NUM_RANGES = { lat: [-90, 90], lng: [-180, 180] };
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
      return;
    }
    // 數值欄驗證：NaN/Infinity 擋下、經緯度限範圍、人口/AB 數不得為負
    for (const c of (t.numCols || [])) {
      if (!(c in obj)) continue;
      if (!Number.isFinite(obj[c])) { errors.push({ row: idx + 1, invalid: c }); return; }
      const r = NUM_RANGES[c];
      if (r && (obj[c] < r[0] || obj[c] > r[1])) { errors.push({ row: idx + 1, out_of_range: c }); return; }
      if (/^(pop_|ab_)/.test(c) && obj[c] < 0) { errors.push({ row: idx + 1, negative: c }); return; }
    }
    cleaned.push(obj);
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
  // 誠實回報：批次寫入全滅 → 500；部分失敗 → ok:false 讓前端顯示警告
  const allOk = failed.length === 0;
  return json({
    ok: allOk,
    total_in: rows.length,
    inserted,
    parse_errors: errors,
    batch_errors: failed
  }, (!allOk && inserted === 0) ? 500 : 200);
}

// CSV parser：支援 quoted cell 內含逗號、雙引號（""）與換行（跨行維持 quote 狀態）
function parseCsv(text) {
  const src = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const records = [];
  let row = [], cur = '', inQ = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      row.push(cur); cur = '';
    } else if (ch === '\n') {
      row.push(cur);
      if (row.some(c => c.length)) records.push(row);
      row = []; cur = '';
    } else {
      cur += ch;
    }
  }
  row.push(cur);
  if (row.some(c => c.length)) records.push(row);
  if (records.length < 2) return [];
  const headers = records[0];
  return records.slice(1).map(cells => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = cells[i] !== undefined ? cells[i] : ''; });
    return obj;
  });
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
