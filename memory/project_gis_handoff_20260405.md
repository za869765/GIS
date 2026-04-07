---
name: GIS 專案交接記錄 2026-04-05
description: jialie_gis_v6.html 當前版本、完成功能、密調表調整歷程、下次啟動指引
type: project
---

當前版本：**v6.552**（`D:\Backup\Desktop\CODE\project\GIS\jialie_gis_v6.html`）
GitHub：`https://github.com/za869765/GIS.git`

**Why:** 本次 session 大量修改登革熱病媒蚊密度調查表列印功能（`printDengueForm()`），需要交接給下次繼續。

**How to apply:** 下次啟動前先 `git pull`，再讀此記錄定向。

---

## 本次完成的功能

- 總表（第一頁）新增，含調查結果總表、孳生源統計表、陽性戶或列管點（5×2）、公式列、WHO 密度等級表
- 調查類別改為 radio-style 按鈕（□/■），預設■常規調查
- 法傳編號欄：僅疑案週邊/確案週邊時顯示
- 上午/下午：只顯示選中的一個，同步至孳生源統計表標題
- 調查者多名：flex 3欄排版（spacer | 標題 | 調查者），`word-break:keep-all`（只在、換行）
- 調查者 +/－ 按鈕，最低 1 個
- 區/里 位置修正：佳里 區　[fil-vil]　里
- 註一/二 移至總表底部（不在每頁重複）
- 陽性戶 5×2 表格，文字水平垂直置中，編號靠左
- grade-wrap 底部對齊（`align-items:flex-end`）

## 密調表行高調整歷程
22 → 34 → 26 → 24 → 22 → 24 → 26 → 24.5 → **24px（目前）**

若 25 行仍超出一頁，可試 23.5px 或縮小 info bar 字級（11.5pt → 10.5pt）

## 已知問題
- 多名調查者換行後 info bar 高度增加，可能使第 25 行溢出至下一頁
- 24px 行高下一頁約能放 25 行，用戶尚未確認是否滿意
