// 公開 endpoint。主頁 jialie_gis_v6.html 開頁時拉這個，把 D1 內 admin 編輯
// 的「新增/修改」覆蓋到 static JS (doornum_db.js / old_addr_map.js) 之上。
// 故意只回 source='admin' 的 row，避免回傳整批 seed 資料（24,788 筆 DOOR_DB）。

export async function onRequestGet({ env }) {
  const db = env.DB;
  const [otn, dd, vi, kv] = await Promise.all([
    db.prepare(
      "SELECT old_addr, new_addr, notes FROM old_to_new WHERE source='admin'"
    ).all(),
    db.prepare(
      "SELECT lat, lng, addr, notes FROM door_db WHERE source='admin'"
    ).all(),
    db.prepare("SELECT * FROM village_info").all(),
    db.prepare("SELECT key, category, value, notes FROM kv_misc").all()
  ]);

  const payload = {
    old_to_new: Object.fromEntries(
      otn.results.map(r => [r.old_addr, r.new_addr])
    ),
    door_db: dd.results.map(r => [r.lat, r.lng, r.addr]),
    village_info: vi.results,
    kv_misc: Object.fromEntries(
      kv.results.map(r => {
        let v = r.value;
        try { v = JSON.parse(r.value); } catch (_) {}
        return [r.key, v];
      })
    ),
    counts: {
      old_to_new: otn.results.length,
      door_db: dd.results.length,
      village_info: vi.results.length,
      kv_misc: kv.results.length
    },
    generated_at: new Date().toISOString()
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60'
    }
  });
}
