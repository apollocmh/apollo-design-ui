# V3 Phase 0 · 文档站视觉与布局基线

> 采样日期：2026-10-22（脚本运行于 2026-10-21 晚）
> Apollo 基线：`master` @ `95029b9d`（生产 preview，en-US，light/dark）
> Ant Design 对照：官方站点 **6.6.7**（采样时实测版本；组件 API 兼容目标仍是 **6.6.4**）
> 证据目录：`docs/audit/visual-v3/`
> 本文只记录**基线与差距**；回归报告在 Phase 4 单独输出，不拿 Apollo 自比 0% 冒充与 Ant 对齐。

## 1. 方法

- 工具：`capture.mjs`（Playwright Chromium，DPR 1，locale en-US，`reducedMotion: reduce`）。
- viewport：1440×900、1920×1080、2560×1440、390×844。
- 页面：home、components overview、Button、FloatButton、Form、DatePicker、Upload、Table；Button 额外采暗色。
- 每页：首屏 + 关键页整页 + 首个 Demo 卡片 + API 表元素截图；同页输出 DOM 盒模型与关键计算样式（`metrics-p0.json`）。
- 暗色：Apollo 通过 `localStorage.apollo-site-theme=dark`；Ant 通过顶栏 Theme 菜单切 Dark theme。
  ⚠️ Ant 移动端没有顶栏主题入口，390 宽度下 Ant 暗色不可采集（Apollo 暗色已采）。
- 语言：Ant 默认英文；Apollo `?lang=en-US`。
- **不做**跨尺寸像素评分；像素比对只用于后续同尺寸回归（Phase 4）。

## 2. 截图索引

```
screenshots/ant/
  {page}-{width}-screen.png          # 首屏
  {page}-1440-full.png               # 整页（home/overview/button/table）
  {page}-1440-card.png               # 首个 demo 卡片（6 个组件页）
  {page}-1440-api.png                # API 表（6 个组件页）
  button-dark-{width}-*.png          # 暗色 Button
screenshots/apollo/                  # 同构命名
```

`capture.mjs --out=p1` 会写入 `screenshots-p1/` 与 `metrics-p1.json`，阶段证据互不覆盖。

## 3. 核心指标（light · 1440/1920/2560）

| 指标 | Ant Design | Apollo（Phase 0） | 差距 |
|---|---:|---:|---|
| 顶栏高度 | 64 | 60 | −4px |
| 左导航宽度 | 300 / 320 / 427 | 232 / 232 / 232 | Apollo 固定且偏窄 |
| 右 TOC 宽度 | 148 | 184 | +36px |
| 组件页 article/content 宽（1440/1920/2560） | 1140 / 1600 / 2133 | **909 / 1170 / 1184** | 1920 −430；2560 **−949** |
| 正文 prose 宽（Button） | 928 / 1388 / 1921 | 909 / 1170 / 1184 | 随 shell 一起被封顶 |
| Demo 卡片宽（Button，2 列） | 456 / 686 / 953 | 444 / 575 / 582 | 2560 时几乎停止增长 |
| Form/Table 首卡宽 | 928 / 1388 / 1921（单列） | 444 / 575 / 582（**双列**） | 宽内容被强行塞进双列 |
| Demo 卡片列数（Button） | 2 | 2 | — |
| Canvas padding | `42px 24px 50px` | `28px` | 统一大留白 |
| Demo 标题 | 14px / 400，**在 Canvas 之后** | 15px / 600，**在 Canvas 之前** | 预览优先级相反 |
| API 表字号 / 单元格 | 13px / `12px 24px` | 13.5px / `9px 14px` | Apollo 更松的字号、更挤的单元格 |
| API 表宽（Button） | 1017（可超出 prose） | 909（被内容栏夹住） | 表格不能横向利用 |
| 移动端横向溢出（390） | 有（home/button/form/table，站点自身问题） | **无** | Apollo 保持无溢出 |

完整逐页数据：`metrics-p0.md`（由 `summarize.mjs` 生成；原始值见 `metrics-p0.json`）。

### 暗色

| | Ant（1440） | Apollo（1440） |
|---|---|---|
| 页面背景 | `rgb(20,20,20)` | `rgb(13,13,13)` |
| 顶栏 / 卡片表面 | 随 Ant token | `--apollo-color-bg-container` |
| API 表头 | `rgba(0,0,0,0.02)` | `rgb(20,20,20)` |

Apollo 暗色已由 `--apollo-*` token 驱动；Phase 1 要求站点不再保留自己的暗色色板。

## 4. 结论（对应报告 V3-01～V3-16）

1. **V3-01/V3-02 成立**：`site.css` 维护独立 `--site-*` 色板，并且 `.site-main` 的总宽封顶
   （`content-max + sidebar + toc`）导致 1920/2560 下主体宽度提前停止增长（2560 比 Ant 窄 949px）。
   Phase 1 目标：token 映射到 `--apollo-*`、删除暗色手填块、取消总宽上限；正文行长用
   `--site-prose-max: 960px` 单独限制。
2. **V3-03/V3-04 成立**：Apollo 用 `columns: 2`，且 Canvas 在标题之后、统一 28px 留白；
   Form/Table 这类宽内容也被压进双列。Phase 2 目标：稳定 CSS Grid；Canvas 第一；
   `compact/interactive/full` 三档；`full` 默认占满一行；展开源码不换列。
3. **V3-05～V3-12 成立**：工具栏、模式切换、顶栏仍是自绘控件。Phase 3 目标：Button /
   Segmented / Tooltip / icons 自举，并输出保留原生语义元素清单。
4. **V3-10/V3-15 部分成立**：API 表密度与组件页辅助链接的视觉权重需单独处理（Phase 4）。
5. **移动端**：Apollo 在 390 无横向溢出，是必须保留的回归基线；Ant 自身在该宽度溢出，不作为目标。
6. **不能据此评价视觉“像不像 Ant”**：本次只采了同尺寸事实，没有做像素评分。Phase 4 才做
   同尺寸 Ant/Apollo 对照与 Apollo 自身的回归基线。

## 5. Phase 1 验收门槛（before → after）

| 指标 | Phase 0 | Phase 1 目标 |
|---|---:|---:|
| 1920 组件内容宽 | 1170 | ≥ 1300 |
| 2560 组件内容宽 | 1184 | ≥ 1900 |
| 顶栏高度 | 60 | 64 |
| 手填暗色 token 块 | 1 个（`[data-apollo-theme="dark"]`） | 0 |
| 正文行长 | 随内容栏无限增长 | ≤ 960px |
| 390 横向溢出 | 无 | 无 |

Phase 2/3/4 的门槛见各阶段提交说明与最终回归报告。
