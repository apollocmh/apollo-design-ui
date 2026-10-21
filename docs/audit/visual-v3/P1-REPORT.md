# V3 Phase 1 · Token 自举 + Full-width Shell + 三栏统一

> 证据：`screenshots-p1/`、`metrics-p1.json`、`metrics-p1.md`
> 对照基线：`V3-BASELINE.md`（Phase 0）

## 1. 改动

| 文件 | 内容 |
|---|---|
| `packages/docs/src/styles/site.css` | `--site-*` 改为 `--apollo-*` 语义别名；删除手填暗色块；`.site-main` 取消总宽封顶；顶栏 64px；侧栏 224 / TOC 184；1199px 以下收起左右栏并启用抽屉 |
| `packages/docs/src/styles/markdown.css` | 文字流（标题 / 段落 / 列表 / 引用）限制 `--site-prose-max: 960px`；table/pre 保持整栏 |
| `packages/docs/src/pages/ComponentPage.vue` | 标题区 32px、节间距 48px；辅助链接降为三级文字色 |

## 2. before → after（light）

| 指标 | P0 | P1 | 目标 | 结果 |
|---|---:|---:|---:|---|
| 顶栏高度 | 60 | **64** | 64 | ✅ |
| 1920 组件内容宽 | 1170 | **1371** | ≥1300 | ✅ |
| 2560 组件内容宽 | 1184 | **2008** | ≥1900 | ✅ |
| 2560 正文实际行长 | 随内容栏（1184+） | **960** | ≤960 | ✅ |
| 手填暗色 token 块 | 1 | **0** | 0 | ✅ |
| 390 横向溢出 | 无 | **无** | 无 | ✅ |
| 390 顶栏 | 搜索文字 + GitHub 图标挤占 | 图标化，侧栏抽屉 | 无溢出 | ✅ |

截图对照：

- 1920：`screenshots-p1/apollo/button-1920-screen.png`
- 2560：`screenshots-p1/apollo/button-2560-screen.png`
- 390：`screenshots-p1/apollo/button-390-screen.png`
- 暗色：`screenshots-p1/apollo/button-dark-1440-screen.png`
- 首页 / 总览：`screenshots-p1/apollo/{home,overview}-*.png`

## 3. 验证

- `vitest run --project unit packages/docs/tests`：12 files / 146 tests passed。
- `smoke-browser.mjs`：36/36（库组件、搜索、图标、移动端抽屉、404、SSG）。
- P1 截图人工核对：三栏职责清晰；2560 内容区铺满；正文行宽受控；390 无横向滚动。

## 4. 仍未做（按阶段划分）

- Demo 卡片仍是“标题 → Canvas → 描述 → 工具栏”，且使用 `columns:2`；Form/Table 仍是双列 —— Phase 2。
- 顶栏 / 工具栏 / 模式切换仍有自绘控件 —— Phase 3。
- API 表密度与最终视觉回归门禁 —— Phase 4。
