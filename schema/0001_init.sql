-- gis-db schema v1
-- 4 個 admin 可管理的資料 table，附 updated_at 觸發追蹤

CREATE TABLE IF NOT EXISTS old_to_new (
  old_addr   TEXT PRIMARY KEY NOT NULL,
  new_addr   TEXT NOT NULL,
  notes      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_old_to_new_new ON old_to_new(new_addr);

CREATE TABLE IF NOT EXISTS door_db (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lat        REAL NOT NULL,
  lng        REAL NOT NULL,
  addr       TEXT NOT NULL UNIQUE,
  notes      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_door_db_addr ON door_db(addr);

CREATE TABLE IF NOT EXISTS village_info (
  village    TEXT PRIMARY KEY NOT NULL,
  head       TEXT,
  phone      TEXT,
  address    TEXT,
  service_area TEXT,
  population INTEGER,
  notes      TEXT,
  extra      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kv_misc (
  key        TEXT PRIMARY KEY NOT NULL,
  category   TEXT,
  value      TEXT,
  notes      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kv_misc_category ON kv_misc(category);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         TEXT NOT NULL DEFAULT (datetime('now')),
  action     TEXT NOT NULL,
  table_name TEXT NOT NULL,
  row_key    TEXT,
  detail     TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);
