# visual-v3 —— 文档站 V3 证据目录

| 文件 | 用途 |
|---|---|
| `capture.mjs` | 同尺寸 Ant / Apollo 采样（首屏 / 整页 / 卡片 / API） |
| `summarize.mjs` | 把 `metrics*.json` 生成 `metrics.md` 表格 |
| `V3-BASELINE.md` | Phase 0 基线与差距结论（人工撰写） |
| `P1-REPORT.md` / `P2-REPORT.md` / `P3-SELF-BOOTSTRAP.md` / `V3-FINAL-REPORT.md` | 各阶段验收与最终结论 |
| `metrics-p0.json` / `metrics-p0.md` | Phase 0 原始指标 |
| `screenshots/` | Phase 0 截图（ant / apollo 分目录） |
| `verify.mjs` | Phase 4 浏览器门禁（布局 / 网格稳定 / 自举 / 移动端） |

## 运行

```bash
# 生产 preview 先行：pnpm --filter @apollo-design/docs exec vite preview --host 127.0.0.1 --port 4477
node docs/audit/visual-v3/capture.mjs                       # P0 全量 → screenshots/ + metrics.json
node docs/audit/visual-v3/capture.mjs --out=p1 --only=home,overview,button
node docs/audit/visual-v3/capture.mjs --only=button --width=1440 --theme=dark --out=dark
node docs/audit/visual-v3/summarize.mjs docs/audit/visual-v3/metrics-p1.json
```

- 每个阶段用 `--out=<label>` 保留独立截图与 metrics，不覆盖历史证据。
- 只采事实，不评分；最终 Ant/Apollo 对照与 Apollo 回归报告在 Phase 4 输出。
