# Apollo Design 文档站 V3 · 最终报告

> 分支：`feature/docs-site-visual-v3`
> Apollo 基线：`master` @ `95029b9d` → P0 `31a04044` → P1 `8714ec90` → P2 `5bd9ba59` → P3 `5087d91b` → P4 `e1f872c1`
> Ant 对照：官方站点 **6.6.7**（API 兼容目标仍为 **6.6.4**）
> 证据：`docs/audit/visual-v3/`（P0–P4 分阶段截图与 metrics）

## 0. 结论

| 阶段 | 状态 | 关键结果 |
|---|---|---|
| P0 同尺寸基线 | ✅ | 1440/1920/2560/390，Ant/Apollo 首屏/整页/卡片/API + DOM 指标 |
| P1 Token + Shell | ✅ | 删除手填色板；2560 内容宽 **1184 → 2008**；正文行长 960；1199 以下抽屉 |
| P2 Demo 系统 | ✅ | Canvas 第一；Form/Table full 档整行；稳定 Grid（展开不换列） |
| P3 自举 | ✅ | 顶栏/工具栏/模式切换/首页 CTA 使用 Apollo Button/Segmented/Tooltip；原生 button 8→3 |
| P4 打磨与门禁 | ✅ | API 表密度、Token 清理、V3 浏览器门禁接入 Docs CI |

## 1. 核心指标（P0 → P4，light）

| 指标 | P0 | P4 | 目标 |
|---|---:|---:|---|
| 1920 组件内容宽 | 1170 | **1371** | ≥1300 ✅ |
| 2560 组件内容宽 | 1184 | **2008** | ≥1900 ✅ |
| 2560 正文实际行长 | 随内容栏 | **960** | ≤960 ✅ |
| 顶栏高度 | 60 | **64** | 56–64 ✅ |
| Form 首卡宽 @1440 | 444（双列） | **917（整行）** | full ✅ |
| Table 首卡宽 @1440 | 444 | **917** | full ✅ |
| Canvas 位置 | 标题之后 | **标题之前** | 预览优先 ✅ |
| Canvas padding | 28 统一 | **compact 18/20；interactive/full 24** | 分档 ✅ |
| API 表字号/单元格 | 13.5px / `9px 14px` | **13px / `10px 16px`** | 更接近文档参考 ✅ |
| 展开源码换列 | 会重排 | **不换列** | 稳定 ✅ |
| 390 横向溢出 | 无 | **无** | 无 ✅ |
| 手填暗色 token 块 | 1 | **0** | 0 ✅ |

### 与 Ant 的最终对照（同尺寸事实，不做像素评分）

| @2560 | Ant 6.6.7 | Apollo P4 | 说明 |
|---|---:|---:|---|
| article / content | 2133 | 2008 | Apollo 侧栏 224 vs Ant 427 |
| prose | 1921 | 960 | 按报告要求限制阅读行长，**有意不同** |
| Demo 卡片（Button） | 953 / 2 列 | 653 / 3 列 | 超宽三列经截图评估可读 |
| 卡片排序 | CSS columns（阅读序与 DOM 可能错位） | Grid 行优先（DOM = 阅读 = Tab 序） | 报告要求稳定顺序 |
| Canvas padding | `42px 24px 50px` | 18/20 或 24 | Apollo 更紧凑，避免小控件空高 |
| API 单元格 | `12px 24px` | `10px 16px` | 接近但更紧凑 |

完整逐页数值见 `metrics-p4.md`；P0 对照见 `metrics-p0.md`。

## 2. 分阶段证据

| 阶段 | 提交 | 证据 |
|---|---|---|
| P0 | `31a04044` | `screenshots/`、`metrics-p0.*`、`V3-BASELINE.md` |
| P1 | `8714ec90` | `screenshots-p1/`、`metrics-p1.*`、`P1-REPORT.md` |
| P2 | `5bd9ba59` | `screenshots-p2/`、`metrics-p2.*`、`P2-REPORT.md` |
| P3 | `5087d91b` | `screenshots-p3/`、`metrics-p3.*`、`P3-SELF-BOOTSTRAP.md` |
| P4 | `e1f872c1` | `screenshots-p4/`、`metrics-p4.*`、`verify.mjs` |

## 3. 验收门禁（P4 实测）

| 门禁 | 结果 |
|---|---|
| `pnpm test` | unit **7267 passed / 3 skipped**、dom-contract **1743**、a11y **1357**、theme **890** |
| `pnpm test:types` | **no type errors**（170 files / 2213 tests） |
| `pnpm lint:types` | 0 errors |
| `node tests/build/run.mjs` | **151 项 / FAIL 0** |
| `docs/audit/visual-v3/verify.mjs` | **20/20**（shell、Grid 稳定、自举、Token、390、暗色） |
| `packages/docs/tests` | 13 files / 150 tests passed |
| `smoke-browser.mjs` | **36/36** |
| `stage2-demo-probe.mjs` | 全部功能断言通过 |
| `tools/docs-visual-diff.mjs` | **9 张基线 / 全部 0.000%**（重生成后） |
| Docs CI | 已新增 `verify.mjs` 步骤，PR 阻塞 |

## 4. 自举清单（详见 `P3-SELF-BOOTSTRAP.md`）

- 顶栏 5 个控件、Demo 工具栏 5 个动作、模式切换、首页 3 个 CTA、错误态重试全部 Apollo primitives。
- 原生 `<button>` 仅保留 3 处：SearchModal 的 `role=option`、DemoSource 的 `role=tab`、IconTile 的整块图标按钮；
  逐项理由已登记。

## 5. 已知限制（非缺陷，明确边界）

- Ant 官网 6.6.7 只作为视觉参照；组件 API 兼容目标仍是 6.6.4，未跟随升级。
- 本文对照为同尺寸事实与人工判读，**没有**用像素评分宣称与 Ant 等价。
- Ant 移动端无顶栏主题入口 ⇒ 390 暗色只有 Apollo 证据。
- Apollo 在 2560 采用 3 列（653px/列）；这是基于截图的展示决策，可通过 Grid 断点调整。
- `SearchModal` 容器与 `DemoSource` tabs 未迁移到 Modal/Tabs：前者涉及焦点陷阱、SSR 与搜索速度，
  后者涉及源码面板 DOM 契约；保留原生语义并在 P3 清单中登记。
- 本次未修改 72 个 UI 组件的功能兼容性与 MOT 动效。

## 6. 发布

- 分支：`feature/docs-site-visual-v3` → PR **#57** → master `15e1d2d0`。
- 记忆提交 `63beb259`；标签 **`v0.1.3`**。
- CI `39655514566` 全绿（lint/L7/types/coverage/registry + L6 四 shard）；
  Deploy Docs `39655514632` 全绿，gh-pages `974126fe`。
- 线上 `https://apollocmh.github.io/apollo-design-ui/` 运行 `verify.mjs`：**20/20**。
