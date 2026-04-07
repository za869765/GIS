---
name: 每次 session 啟動前先 git pull（雲端為主）
description: 啟動任何專案前必須先從 GitHub pull，確保地端與雲端同步
type: feedback
---

**當使用者輸入「繼續」時，依序執行以下步驟，不需等待其他指令：**

1. `git pull` GIS repo
2. `git pull` EAF repo
3. 將 GIS repo 的 `memory/` 資料夾內容同步複製到本地 `.claude` 記憶資料夾（`C:/Users/MIHC/.claude/projects/D--Backup-Desktop-CODE-project----/memory/`）
4. 接著上次進度繼續

```bash
cd D:/Backup/Desktop/CODE/project/GIS && git pull
cd D:/Backup/Desktop/CODE/project/EAF && git pull
cp D:/Backup/Desktop/CODE/project/GIS/memory/*.md "C:/Users/MIHC/.claude/projects/D--Backup-Desktop-CODE-project----/memory/"
```

**Why:** 使用者明確要求「以雲端為主」——所有修改均已 push 到 GitHub，記憶檔案也納入 GIS repo 管理，換電腦或跨 session 時需同步更新。

**How to apply:** session 一開始、讀任何專案檔案之前，先執行上述三步驟。若有 conflict，告知使用者再處理，不可自行 force。
