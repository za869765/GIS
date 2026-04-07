---
name: EAF 所有修正必須寫入 D1
description: 每次資料補丁或遷移函式，除了寫 localStorage 也必須同步寫入 D1
type: feedback
---

所有資料修正（patch/migration）必須同時寫入 D1，不能只寫 localStorage。

**Why:** D1 是跨電腦/跨瀏覽器的唯一可信來源。只寫 localStorage 的修正在換電腦後會被 accInitSync 從 D1 覆蓋回舊值，導致修正失效。

**How to apply:**
- 每個 patch 函式除了操作 localStorage，都要呼叫 `accSave(key, value)` 或直接 fetch POST `/api/acc`
- `accSave` 需要 `sessionStorage.getItem('adminPass')`，v4.1.0 起已同步至 localStorage，所以 patch 執行時 adminPass 應已可用
- 確認 fetch 有帶 `X-Admin-Pass` header
