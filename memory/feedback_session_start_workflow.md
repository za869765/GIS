---
name: 每次 session 啟動前先 git pull（雲端為主）
description: 啟動任何專案前必須先從 GitHub pull，確保地端與雲端同步
type: feedback
---

**當使用者輸入「繼續」時，立即執行 git pull，不需等待其他指令。**

每次新 session 開始，**先 pull 再動工**：

```bash
cd D:/Backup/Desktop/CODE/project/GIS && git pull
cd D:/Backup/Desktop/CODE/project/EAF && git pull
```

**Why:** 使用者明確要求「以雲端為主」——所有修改均已 push 到 GitHub，換電腦或跨 session 時地端可能落後雲端，直接改地端檔案會造成衝突或覆蓋遺失。

**How to apply:** session 一開始、讀任何專案檔案之前，先執行對應的 `git pull`。若有 conflict，告知使用者再處理，不可自行 force。
