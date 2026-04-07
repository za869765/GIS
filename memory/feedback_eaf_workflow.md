---
name: 所有專案修改工作流程規範
description: 所有專案每次修改（含小改/debug）必須更新版本號 + commit + push，完成後告知版本號；疑問時授權操控瀏覽器觀看
type: feedback
---

所有專案的每次修改（包含小改動、debug 修正）完成後，**必須依序**：

1. **更新版本號**（HTML 頁面內的版本號欄位，通常格式如 `v6.552`）
2. **同步所有相關頁面版本號**：只要任一檔案被改，同一專案所有 HTML 頁面版本號必須同步到相同新版次（不能各自不同）
3. **git commit**（訊息包含版本號與修改說明）
4. **git push**
5. **明確告知使用者最新版本號**

**Why:** 使用者需要版本號來識別當前部署版本，換電腦時以雲端為主，版號不同步會造成混亂。

**How to apply:** 任何改動，無論大小，都要走完這五步，不能只改檔案不推版。若有修改疑問，使用者已授權操控瀏覽器直接觀看。

---

## 彈窗必須有 CSS 動畫

**所有專案的任何 modal / popup / dialog**，新增或修改時都必須加入 CSS 入場動畫（如 fadeIn + slideDown）。

```css
/* 標準範本 */
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes slideDown { from{transform:translateY(-16px)} to{transform:translateY(0)} }
.modal-overlay { animation: fadeIn .2s ease; }
.modal-box    { animation: slideDown .2s ease; }
```

**Why:** 使用者明確要求所有彈窗都要有動畫，不需每次提醒。

**How to apply:** 只要動到任何彈窗相關 HTML/CSS/JS，確認動畫存在。若是新增彈窗，直接套用上述範本。

---

## 資料庫操作必須寫入 D1（僅 EAF、ACC 專案）

**EAF 和 ACC 專案**涉及資料持久化的功能，不能只寫 localStorage / sessionStorage，必須同步寫入 **Cloudflare D1**。GIS 及其他專案不使用 D1。

**Why:** D1 是跨電腦/跨瀏覽器的唯一可信來源。只寫本地的資料換電腦後會被 D1 覆蓋回舊值。

**How to apply:**
- EAF / ACC：每個 patch/migration 函式呼叫 `accSave(key, value)` 或 fetch POST `/api/acc`，帶 `X-Admin-Pass` header
- GIS 及其他專案：無 D1，資料持久化透過 **GitHub**（git commit + push）管理

---

## 啟動流程（輸入「繼續」時）

```bash
cd D:/Backup/Desktop/CODE/project/GIS && git pull
cd D:/Backup/Desktop/CODE/project/EAF && git pull
```

再讀交接記錄，確認當前版本與待辦後才開始動工。
