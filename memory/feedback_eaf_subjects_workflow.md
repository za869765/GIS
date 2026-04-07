# EAF 科目資料來源與修改工作流程

## 線上網址
- 前台：https://eaf-6hw.pages.dev/
- 管理後台：https://eaf-6hw.pages.dev/admin
- 管理後台密碼：1234
- 科目 API：https://eaf-6hw.pages.dev/api/subjects

## 資料來源優先順序
程式啟動時依序嘗試：
1. **雲端 D1 資料庫**（`/api/subjects`）→ 有則用之
2. **地端 subjects.json**（靜態檔案備援）→ D1 無資料才讀此檔

## 科目修改標準流程（每次都要執行）
1. **GET** `https://eaf-6hw.pages.dev/api/subjects` → 取得 D1 最新資料為基礎
2. 在 D1 資料上做修改
3. **POST** `https://eaf-6hw.pages.dev/api/subjects`（Header: `X-Admin-Pass: 1234`）→ 寫回 D1
4. 同步更新地端 `subjects.json` + commit + push GitHub（僅作備份用）

> ⚠️ D1 才是唯一真實來源，地端 subjects.json 是**緊急備援**。
> 當 D1 發生問題時，subjects.json 作為舊版救援使用，平時不代表最新狀態。

## 目前狀態（2026-04-02 更新）
- D1 已完成初始化（從 subjects.json POST 上去）
- 程式讀 D1 → subjects.json 退為備份
- 往後修改科目一律走上方標準流程

## 重要原則
- **雲端 D1 = 唯一可信的資料來源**
- **地端 subjects.json = 舊備份，不代表現在的實際狀態，不可直接信任**
- 使用者可能換電腦，地端檔案一定是舊的，**永遠以雲端為主**
- 只要使用者在管理後台按過「儲存科目設定」，D1 就會接管，subjects.json 完全退休
- 修改科目時：**先讀雲端 → 在雲端資料上修改 → push subjects.json 同步備份**

## 目前狀態（2026-04-02 session 結束後更新）
- D1 `settings` table 已有 subjects 資料（使用者從後台儲存過科目）
- `/api/subjects` GET 正常回傳，D1 為主要來源
- subjects.json 退為舊備援，不代表最新狀態
- 往後修改科目一律走標準流程（先讀 API → 改 → POST 回 D1）
