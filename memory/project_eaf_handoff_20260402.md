---
name: EAF 專案交接記錄 2026-04-02
description: EAF 動支管理系統本日 session 完成項目、當前版本狀態與待確認事項
type: project
---

## 當前版本：v2.5.7（2026-04-02 session 結束）

**Why:** 使用者換電腦後可直接從此記錄接力，不需重問現狀。
**How to apply:** 開始新 session 時先讀此檔，確認版本號與雲端部署狀態。

---

## 系統資訊

- **前台**：https://eaf-6hw.pages.dev/
- **後台**：https://eaf-6hw.pages.dev/admin　（密碼：1234）
- **GitHub**：https://github.com/za869765/EAF
- **本地路徑**：D:\Backup\Desktop\CODE\project\EAF
- **部署平台**：Cloudflare Pages + D1（SQLite）
- **主要檔案**：index.html / admin.html / functions/api/records.js / presence.js / subjects.js

---

## 本日完成的功能（v2.5.3 → v2.5.7）

### v2.5.3
- **未分類紀錄**：允許不選預算科目存檔，側欄紅底卡片（`unclassified` CSS class），鎖定後僅開放預算欄位補登（`補登存檔`按鈕），`loadRecord` 部分鎖定邏輯
- **後台未分類紅底列** + ⚠ 未分類標示（`acctCode` 為空）
- **單筆操作彈窗顯示憑證編號**（toggleLock/restoreVoid/archiveRecord 加 vNo 參數）
- **儲存/作廢後狀態列 0.8 秒回復「已連線」**（setTimeout 回復）
- **後台紀錄管理關鍵字過濾**（`applyRecFilter()` + 過濾 input）

### v2.5.4
- **報表新增累積賸餘小卡**（內嵌主科目分布面板底部虛線分隔下）
- **報表新增醫療用品分月柱狀圖**（大圖風格，同各月申請金額）
- **科目管理預設鎖定**：`_subjLocked=true`，需點解鎖+確認才能操作，overlay 遮罩防誤觸
- **狀態列改 0.8 秒**回復

### v2.5.5
- **累積賸餘**精簡（內嵌主科目分布下方，無獨立面板）
- **醫療用品**分月柱狀圖（只顯示有申請的月份）

### v2.5.6
- **修正維護模式無效根本原因**：`presence.js` 讀取 `subjects WHERE id='main'`（不存在的 table），改為讀 `settings WHERE key='subjects'`
- **維護按鈕配色修正**：維護停用→橘紅警告色 `#e65100`，恢復使用→綠色 `#2e7d32`
- **累積賸餘移入主科目面板底部**（移除獨立卡片）
- **醫療用品改大圖趨勢**，固定柱寬 40px + 橫向捲動
- **醫療用品拆分 藥品/衛材**：依 `purposeDesc` 含「藥品」分類，各自獨立分月圖（💊紫色 / 🩹青色）

### v2.5.7
- **修正維護模式頁面載入後被覆蓋**：`loadHistory()` 結束時無條件呼叫 `setSyncStatus('已連線')`，覆蓋了 init 設定的「維修中」狀態。改為依 `_maintenance` 旗標決定。

---

## 重要架構備忘

### 維護模式完整流程
1. 後台按「維護停用」→ `toggleMaintenance()` → 寫 `subjects.settings.maintenance=true` 到 D1 `settings` table
2. 前台 `heartbeat()` 每 60 秒或每次點擊呼叫 `/api/presence`（POST）
3. `presence.js` 讀 `settings WHERE key='subjects'` → 回傳 `maintenance` 旗標
4. 前台偵測值改變 → `setSyncStatus('● 維修中', 'err')` / `_maintenance=true`
5. `checkMaintenance()` 在 `saveRecord()` 和 `voidRecord()` 前攔截

### 未分類紀錄邏輯
- 儲存時不強制要求 `acctCode`（無阻擋）
- 側欄：`!rec.acctCode` → `h-item unclassified`（紅底）
- 後台列：`!rec.acctCode && !isVoid && !isArchived` → `unclassified-row`（淡紅底）
- 載入表單：`isUnclassified = !rec.acctCode && !rec.voided` → 加 `page.classList.add('unclassified')` → 三個預算下拉可編輯，按鈕顯示「補登存檔」
- 過濾器：`_unclassified` 選項

### 科目管理鎖定
- `_subjLocked = true`（預設）
- 解鎖需確認彈窗 → `_subjLocked = false` → 顯示「＋新增主科目」「💾儲存」按鈕，移除 overlay
- 重新鎖定：點「🔓 編輯中 — 點此重新鎖定」

### D1 資料表結構
- `records`：id, voucher_no, form_type, voided, saved_at, data（JSON）
- `settings`：key, value（subjects 科目設定存這裡）
- `presence`：sid, last_seen（在線人數追蹤）

---

## 待確認/已知限制

- **科目管理鎖定**：目前僅靠前端 overlay 防護，解鎖後直接可改。若要更嚴格需後端驗證，但目前設計適合內部使用情境。
- **維護模式同步延遲**：最長 60 秒（下次心跳），點擊頁面會立即觸發心跳縮短等待。
- **醫療用品藥品/衛材分類**：依 `purposeDesc`（用途說明欄）含「藥品」字串判斷，若填寫不規範可能分類不準。

---

## D1 資料狀態（2026-04-02 確認）
- subjects 科目設定已存入 D1 `settings` table（使用者已從後台儲存過）
- D1 = 唯一可信來源，subjects.json 為舊備援，不代表最新狀態
- 修改科目一律：先讀 `/api/subjects` → 修改 → POST 回 D1
