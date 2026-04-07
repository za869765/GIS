# Memory Index

- [所有專案修改工作流程規範](feedback_eaf_workflow.md) — 版本號更新+同步+push+告知；彈窗必須有CSS動畫；資料庫必須寫D1；「繼續」觸發git pull
- [MD 交接記錄寫入時機](feedback_md_timing.md) — 日期.md 只在 session 結束時寫入，不在每次修改後寫入
- [EAF 科目資料來源與修改工作流程](feedback_eaf_subjects_workflow.md) — 修改科目前先 fetch 雲端 API 確認 D1 狀態；網址/密碼/判斷邏輯均在此；已授權使用管理後台
- [EAF 所有修正必須寫入 D1](feedback_eaf_d1_writes.md) — patch/migration 函式必須同時寫 localStorage + D1，否則換電腦後被覆蓋
- [EAF 專案交接記錄 2026-04-02](project_eaf_handoff_20260402.md) — 當前版本 v2.5.7，本日完成功能清單、架構備忘、D1 狀態、待確認事項
- [GIS 專案交接記錄 2026-04-07](project_gis_handoff_20260407.md) — jialie_gis_v6.html v6.553，新舊門牌對照 old_addr_map.js（2524組）、10筆補座標、潭墘街33筆
- [GIS 專案交接記錄 2026-04-05](project_gis_handoff_20260405.md) — jialie_gis_v6.html v6.552，密調表行高歷程、已知問題
- [每次 session 啟動先 git pull](feedback_session_start_workflow.md) — 雲端為主，啟動時先 pull GIS/EAF 兩個 repo 再動工
