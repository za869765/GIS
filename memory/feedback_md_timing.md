---
name: MD 交接記錄寫入時機
description: 日期.md 只在 session 結束時寫入，不在每次修改後寫入
type: feedback
---

每日交接 md（YYYY-MM-DD.md）只在 session 結束時（使用者說「結束」「今天就到這」等）才寫入一次，整理當天所有工作內容。

不要在每次完成修改後都寫 md。

**Why:** 使用者認為每次修改都寫 md 太頻繁，沒有必要。

**How to apply:** 修改完成後直接 commit/push，不寫 md。只有 session 結束指令出現時才整理並寫入 md。
