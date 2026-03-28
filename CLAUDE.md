# 佳里 GIS 專案

## WHAT — 技術棧
- 純靜態單頁 HTML（jialie_gis_v6.html）
- Leaflet.js 地圖、TopoJSON 村里界、IndexedDB 離線資料庫
- Service Worker 離線快取
- 部署：Cloudflare Pages（gis-2bh.pages.dev），連接 GitHub repo za869765/GIS

## WHY — 目的
臺南市佳里區 GIS 查詢系統，支援門牌座標離線查詢、地籍圖疊加、路名搜尋。
設計目標：可離線使用、純前端、無後端伺服器。

## HOW — 工作方式

### MUST
- MUST 修改版次：每次變更 jialie_gis_v6.html，MUST 同步更新 `<title>` 內的版次號（如 v6.335 → v6.336）
- MUST 在修改前先讀取相關程式碼，理解現有邏輯再動手
- MUST 保持 Service Worker 程式碼字串內語法正確（注意物件屬性用 `:` 非 `=`）
- MUST 確認 `searchAddressInDb` 回傳物件的 key 名稱與呼叫端解構一致

### NEVER
- NEVER 在未讀取檔案的情況下建議或修改程式碼
- NEVER 新增不必要的依賴或後端邏輯
- NEVER 使用 `git add -A` 或 `git add .`，改用指定檔名

### Git 流程
- commit 訊息用繁體中文
- push 後確認 Cloudflare Pages 自動部署成功
