---
name: 每次 session 啟動前先 git pull（雲端為主）
description: 啟動任何專案前必須先從 GitHub pull，確保地端與雲端同步
type: feedback
---

**當使用者輸入「繼續」時，依序執行以下步驟，不需等待其他指令：**

1. `git pull` GIS repo（project 根目錄）
2. `git pull` EAF repo
3. CLASS repo：資料夾空則 `git clone`，否則 `git pull`
4. 將 GIS repo 的 `memory/` 資料夾內容同步複製到本地 `.claude` 記憶資料夾
5. 接著上次進度繼續

**GitHub repos：**
- GIS：`za869765/GIS`（project 根目錄）
- EAF：`za869765/EAF`（project/EAF 獨立 repo）
- CLASS：`za869765/CLASS`（project/CLASS 獨立 repo）

**Why:** 使用者明確要求「以雲端為主」——所有修改均已 push 到 GitHub，記憶檔案也納入 GIS repo 管理，換電腦或跨 session 時需同步更新。CLASS 是獨立 repo，首次需 clone。

**How to apply:** session 一開始、讀任何專案檔案之前，先執行上述步驟。若有 conflict，告知使用者再處理，不可自行 force。不要報告「資料夾是空的」，直接 clone 下來。
