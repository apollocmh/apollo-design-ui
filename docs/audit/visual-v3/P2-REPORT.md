# V3 Phase 2 · Demo 系统视觉结构（画布优先 / 稳定 Grid / 档位）

> 证据：`screenshots-p2/`、`metrics-p2.json`、`metrics-p2.md`
> 对照：`V3-BASELINE.md`、`P1-REPORT.md`

## 1. 改动

| 文件 | 内容 |
|---|---|
| `DemoPreview.vue` | DOM 改为 **Canvas → 标题/说明 → 工具栏 → 源码**；移除虚线画布边；画布按档位设留白 |
| `composables/demo-layout.ts` | `compact / interactive / full` 默认推断 + `span` 解析；组件源码不感知文档站 |
| `types/manifest.ts` | `DemoPreviewConfig` 增加 `size` / `span`（展示元数据） |
| `tooling/content/build-manifest.mjs` | 解析并校验 size/span；非法值直接报错 |
| `ComponentPage.vue` | `columns:2` → 稳定 CSS Grid（2 列；≤1080 单列；≥2200 三列）；`full` 档占满一行 |
| `tests/demo-layout.test.ts` | 档位默认值与显式覆盖 |

## 2. before → after

| 指标 | P1 | P2 | 说明 |
|---|---:|---:|---|
| Form 首卡宽 @1440 | 444（双列） | **917（整行）** | `full` 档默认 |
| Table 首卡宽 @1440 | 444 | **917** | 同上 |
| Button 首卡宽 @1440 | 448 | 448 | 2 列 |
| Button 列数 @2560 | 2 | **3**（653/列） | 真截图评估后可读，未挤压 |
| Canvas 位置 | 标题之下 | **标题之上**（canvas.y < title.y） | 预览优先 |
| Canvas padding | 28 统一 | **compact 18/20；interactive/full 24** | 不留统一空高 |
| 展开源码换列 | CSS columns 会重排 | **不换列**（实测 DOM x 列表前后全等） | 稳定顺序 |
| 390 横向溢出 | 无 | **无** | 保持 |

截图：`screenshots-p2/apollo/{button,form,table,date-picker,upload,float-button}-{1440,1920,2560,390}-screen.png`。

## 3. 验证

- `packages/docs` 单测：13 files / 150 tests passed。
- `smoke-browser.mjs`：36/36。
- 浏览器手工探针：Button @1440 展开首个源码后，20 张卡片的 x 坐标列表与展开前完全一致；
  `.demo-source` 出现；首卡高度 867.7px（行高增长但不换列）。

## 4. 边界

- `position: fixed` 仍使用 `DemoViewport`（未改成 absolute）；P2 只调整了画布留白与卡片结构。
- 工具栏仍是原生按钮（Phase 3）；API 表密度仍是旧样式（Phase 4）。
