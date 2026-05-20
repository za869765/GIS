// GET /api/export/:name?format=csv|json&source=admin|seed&q=keyword&has_overlay=1
//   format    預設 csv
//   source    admin / seed / 不填 = 全部
//   q         關鍵字搜尋 (LIKE)
//   has_overlay=1  限定有整編紀錄的 (只給 door_db 用：door_db.addr 與 old_to_new.new_addr 對應)

const TABLES = {
  old_to_new: {
    cols: ['old_addr', 'new_addr', 'notes', 'source', 'updated_at'],
    likeCols: ['old_addr', 'new_addr', 'notes']
  },
  door_db: {
    cols: ['id', 'lat', 'lng', 'addr', 'notes', 'source', 'updated_at'],
    likeCols: ['addr', 'notes']
  },
  village_info: {
    cols: ['village', 'nurse', 'head_name', 'tel', 'mobile', 'address',
           'pop_total', 'pop_male', 'pop_female', 'pop_young', 'pop_adult', 'pop_old',
           'ab_total', 'ab_plain', 'ab_mountain', 'prev_care', 'notes', 'source', 'updated_at'],
    likeCols: ['village', 'nurse', 'head_name', 'tel', 'mobile', 'address', 'notes']
  },
  kv_misc: {
    cols: ['key', 'category', 'value', 'notes', 'source', 'updated_at'],
    likeCols: ['key', 'category', 'value', 'notes']
  }
};

export async function onRequestGet({ env, params, request }) {
  const t = TABLES[params.name];
  if (!t) return new Response('unknown table', { status: 404 });

  const url = new URL(request.url);
  const format = url.searchParams.get('format') === 'json' ? 'json' : 'csv';
  const q = url.searchParams.get('q') || '';
  const source = url.searchParams.get('source');
  const hasOverlay = url.searchParams.get('has_overlay') === '1';

  const where = [];
  const binds = [];
  if (q) {
    where.push('(' + t.likeCols.map(c => `${c} LIKE ?`).join(' OR ') + ')');
    t.likeCols.forEach(() => binds.push(`%${q}%`));
  }
  if (source === 'admin' || source === 'seed') {
    where.push(`${params.name}.source = ?`);
    binds.push(source);
  }

  let sql;
  if (hasOverlay && params.name === 'door_db') {
    // 整編紀錄篩選：door_db.addr 去掉「臺南市佳里區」前綴後與 old_to_new.new_addr 對應
    sql = `SELECT door_db.*,
                  (SELECT old_addr FROM old_to_new
                   WHERE old_to_new.new_addr = REPLACE(REPLACE(door_db.addr,'臺南市佳里區',''),'台南市佳里區','')
                   LIMIT 1) AS old_addr
           FROM door_db
           WHERE EXISTS (
             SELECT 1 FROM old_to_new
             WHERE old_to_new.new_addr = REPLACE(REPLACE(door_db.addr,'臺南市佳里區',''),'台南市佳里區','')
           )
           ${where.length ? 'AND ' + where.join(' AND ') : ''}`;
  } else {
    sql = `SELECT * FROM ${params.name} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
  }

  const res = await env.DB.prepare(sql).bind(...binds).all();
  const rows = res.results;

  const fname = `${params.name}_${new Date().toISOString().slice(0, 10)}.${format}`;
  if (format === 'json') {
    return new Response(JSON.stringify(rows, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fname}"`
      }
    });
  }

  // CSV
  if (!rows.length) {
    return new Response('', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fname}"`
      }
    });
  }
  const cols = Object.keys(rows[0]);
  const csv = [
    cols.join(','),
    ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))
  ].join('\n');
  // UTF-8 BOM 讓 Excel 開啟不會亂碼
  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fname}"`
    }
  });
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
