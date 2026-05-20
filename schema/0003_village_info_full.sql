-- village_info 改成對應 jialie_gis_v6.html 主頁實際欄位
-- 來源 (line 2169 VIL_TO_MANAGER / 2178 VIL_CHIEF / 2202 VIL_DEMOG)

DROP TABLE IF EXISTS village_info;

CREATE TABLE village_info (
  village     TEXT PRIMARY KEY NOT NULL,   -- 六安里
  nurse       TEXT,                          -- 護理師 (陳翊瑄)
  head_name   TEXT,                          -- 里長姓名 (林佩玲)
  tel         TEXT,                          -- 市話 (06-7231761)
  mobile      TEXT,                          -- 手機 (0928798822)
  address     TEXT,                          -- 里辦地址 (安北路58巷19號)
  pop_total   INTEGER,                       -- 總人口 (4799)
  pop_male    INTEGER,                       -- 男 (2340)
  pop_female  INTEGER,                       -- 女 (2459)
  pop_young   INTEGER,                       -- 0-14 幼年 (592)
  pop_adult   INTEGER,                       -- 15-64 壯年 (3294)
  pop_old     INTEGER,                       -- 65+ 老年 (913)
  ab_total    INTEGER,                       -- 原住民合計 (8)
  ab_plain    INTEGER,                       -- 平地原住民 (5)
  ab_mountain INTEGER,                       -- 山地原住民 (3)
  prev_care   TEXT,                          -- 預防保健 JSON {br,cx,fc,lv,om,lm,lf,ac,...}
  notes       TEXT,
  source      TEXT NOT NULL DEFAULT 'admin', -- 'seed' / 'admin'
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_village_info_source ON village_info(source);
CREATE INDEX idx_village_info_nurse  ON village_info(nurse);
