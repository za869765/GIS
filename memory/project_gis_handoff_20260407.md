---
name: GIS 專案交接記錄 2026-04-07
description: jialie_gis_v6.html v6.553，新舊門牌對照搜尋功能完成、old_addr_map.js 建立
type: project
---

當前版本：**v6.553**（`D:\Backup\Desktop\CODE\project\GIS\jialie_gis_v6.html`）
GitHub：`https://github.com/za869765/GIS.git`（已 push，commit: ea7f684）

**Why:** 本次 session 建立佳里區門牌整編新舊對照功能，舊址可作為搜尋索引，新址 pin 顯示原址備註。

**How to apply:** 下次啟動前先 `git pull`，再讀此記錄定向。

---

## 本次完成的功能

### old_addr_map.js（新建）
- 佳里區 7 批次門牌整編 CSV 合併，共 **2,524 組** OLD_TO_NEW / NEW_TO_OLD
- 來源批次：子良廟 111/01/25、佳化/安西/海澄 111/07/07、後庄/潭墘 112/01/11、鎮山/文新/南勢 112/04/26、忠仁/建中東街 113/02/22、鎮山/忠仁/南勢/塭內 113/05/30、安西/新宅 113/12/25
- 移除 2 筆無效對照：潭墘8之3號→潭墘街139巷69弄63號、潭墘12號→潭墘街60號（無此地址）

### jialie_gis_v6.html 修改
- 載入 `<script src="old_addr_map.js">`
- `onMapSearch()`：搜尋舊址時透過 OLD_TO_NEW 找新址座標，合併進結果列表
- `_placePin()`：tooltip 加入「原址：X」備註（查 NEW_TO_OLD）

### doornum_db.js 修改
- 補入 10 筆新整編地址座標（原 12 筆缺漏，其中 2 筆為無效地址）：
  - 子龍一街16號、麻佳路三段40號、子龍五街43號、麻佳路三段520號
  - 麻興路二段478巷10號、佳化二街12號、佳興一街32巷67號、佳化一街81號
  - 佳興七街75號、佳青路一段180巷21號

## 潭墘街現況
- DB 共 33 筆，含 139巷69弄25號/31號/39號（弄內地址，用戶確認保留）
- 截圖查詢系統顯示 30 筆（無弄內地址，但 DB 保留備用）
