-- 加 source 欄位區分「seed (從 static JS 灌進來)」與「admin (管理者編輯)」
-- overlay endpoint 只回 source='admin' 的 row，避免回傳整批 seed 資料

ALTER TABLE old_to_new   ADD COLUMN source TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE door_db      ADD COLUMN source TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE village_info ADD COLUMN source TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE kv_misc      ADD COLUMN source TEXT NOT NULL DEFAULT 'admin';

UPDATE old_to_new SET source='seed';
UPDATE door_db    SET source='seed';

CREATE INDEX IF NOT EXISTS idx_old_to_new_source ON old_to_new(source);
CREATE INDEX IF NOT EXISTS idx_door_db_source    ON door_db(source);
