# ROADMAP.md

> 定义**什么时候做什么**：整体路线、四个 Phase、十个波次、可并行任务列表、持续开发机制。
>
> 本文档的所有数字与成员归属**由工具推导**（`registry/workstreams.json`），不手工维护。
> 想看实时状态：`node registry/tools/next-task.mjs --parallel`

---

## 1. 路线总览

```
Phase 1  侦察与架构定型 ──────────────────────────────── ✅ 已完成
  └── 摸清 antd 6.6.4 · 定包结构 · 建 Registry · 建测试体系 · 建长期开发规范

Phase 2  基础设施（13 个包）───────────────────── W1 → W2 → W3
  └── 目标：让「组件可以建立在真地基上」

Phase 3  组件实现（72 个）───────────────── W4 → W5 → W6 → W7 → W8
  └── 目标：72/72 完成，11 个维度全绿

Phase 4  生态与持续运营 ──────────────────────────────── W9
  └── 文档站 · SSR · 按需引入 · 主题市场 · 迁移工具
```

| Phase | 波次 | 内容 | 单元数 | 状态 |
|---|---|---|---|---|
| 1 | W0 | 侦察与架构 | — | ✅ 完成 |
| 2 | W1 | 地基：无依赖包 + AR1/AR2 的 PoC | 9 | ✅ 完成（2026-09-22 前） |
| 2 | W2 | 能力层：依赖 utils 的 7 个包 | 7 | ✅ 完成（仅 picker 收口中） |
| 2 | W3 | 组合层：overlay | 1 | ✅ 完成 |
| 3 | W4~W8 | 组件实现（72 个，由 DAG 自动驱动） | 72 | ▶ **20/72 完成**（见 §11） |
| 4 | W9 | 生态与持续运营 | — | 待启动 |

**关键路径**：`utils →（portal + position + a11y）→ overlay →（Tooltip/Popover/Dropdown…）`。
**最大产能释放点**：W6（26 个单元，占全部 Work Item 的 28%）。

---

## 2. 图一 · 项目整体架构

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    antd 6.6.4（只读参考 = 规范，不是代码来源）               │
│              API 形状 · 行为 · Design Token · 视觉 · 无障碍语义              │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ extract-antd-facts.mjs（只提取事实）
                                ▼
                  registry/source/antd-6.6.4.raw.json
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  components.json        dependencies.json         tokens.json
  72 组件 × 11 维度      13 包 + DAG 153 边       34 / 140 / 222 / 517
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                     foundation.json（13 包 × 6 维度）
                                │
                                ▼
                     workstreams.json（92 Work Item / 15 泳道 / 10 波次）
                                │
                                ▼
                    ┌───────────────────────┐
                    │  next-task.mjs        │ ← 唯一权威的任务来源
                    │  默认=一个 / --parallel=一批 │
                    └───────────┬───────────┘
                                │
   ┌────────────────────────────┼────────────────────────────┐
   ▼                            ▼                            ▼
┌──────────┐            ┌──────────────┐            ┌──────────────┐
│ L0 地基  │            │ L1 基础设施   │            │ L2 领域引擎   │
│ utils    │───────────►│ motion       │            │ overlay      │
│ theme    │───────────►│ portal       │─────┬─────►│ form-core    │
│ icons    │            │ position ⚠AR1│     │      │ picker       │
└──────────┘            │ a11y         │─────┤      │ locale       │
                        │ virtual-list │     │      └──────┬───────┘
                        └──────────────┘     │             │
                                ▲            └─────────────┘
                                │                    │
                        ┌───────┴────────────────────┴───────┐
                        │   L3  @apollo-design/ui（72 组件）    │
                        │   通用 3 · 布局 6 · 导航 8            │
                        │   数据录入 18 · 数据展示 22           │
                        │   反馈 10 · 其他 5                    │
                        └──────────────────────────────────────┘
                        ┌──────────────────────────────────────┐
                        │   T   test-utils（private，不发布）    │
                        └──────────────────────────────────────┘
```

---

## 3. 图二 · 基础设施依赖关系

```
  L0   ┌─────────┐        ┌─────────┐        ┌─────────┐
       │  utils  │        │  theme  │        │  icons  │
       │ 72/72   │        │ 72/72   │        │  37     │
       └────┬────┘        └────┬────┘        └────┬────┘
            │                  │                  │
  ══════════╪══════════════════╪══════════════════╪═══════════════
  L1        ▼                  ▼                  ▼
       ┌─────────┐        ┌─────────┐        ┌─────────┐
       │ motion  │        │ portal  │        │   a11y  │
       │   20    │        │   21    │        │   28    │
       │  ⚠AR2   │        └────┬────┘        └────┬────┘
       └─────────┘             │                  │
                    ┌──────────┴───────┐          │
                    ▼                  ▼          │
              ┌──────────┐      ┌─────────────┐   │
              │ position │      │virtual-list │   │
              │   15     │      │     5       │   │
              │  ⚠AR1    │      └─────────────┘   │
              └────┬─────┘                        │
                   │                              │
  ═════════════════╪══════════════════════════════╪═══════════════
  L2               └───────────┬──────────────────┘
                               ▼
                        ┌─────────────┐     ┌───────────┐ ┌────────┐
                        │   overlay   │     │ form-core │ │ picker │
                        │     15      │     │    16     │ │   3    │
                        └──────┬──────┘     └─────┬─────┘ └───┬────┘
                               │                  │           │
                               └────────┬─────────┴───────────┘
                                        ▼
                              ┌──────────────────┐
                              │ locale（生成物）  │
                              └────────┬─────────┘
  ═════════════════════════════════════╪═══════════════════════════
  L3                                   ▼
                              ┌──────────────────┐
                              │ @apollo-design/ui │
                              │    72 个组件      │
                              └──────────────────┘
```

**波次归属**

| 波次 | 包 | 并行度 |
|---|---|---|
| **W1** | `utils` `theme` `icons` `locale` `test-utils` + `position:poc` + `motion:poc` | 5 条泳道同时开工 |
| **W2** | `motion` `portal` `position` `a11y` `virtual-list` `form-core` `picker` | 6 条泳道同时开工（全部只依赖 utils） |
| **W3** | `overlay` | 1（依赖 portal + position + a11y） |

**关键洞察**：13 个包**不需要 13 步**。它们只需要 **3 个波次**，因为 W2 的 7 个包彼此完全独立。

---

## 4. 图三 · 组件依赖关系（DAG）

依赖层级（`registry/dependencies.json → componentDag`，E4 保证无环）：

```
  L0 (19)  无组件依赖
  ┌────────────────────────────────────────────────────────────────────┐
  │ affix  alert  app  border-beam  carousel  date-picker  descriptions │
  │ divider  empty  image  listy  masonry  result  spin  splitter       │
  │ switch  typography  upload  watermark                               │
  └───────────────────────────────┬────────────────────────────────────┘
                                  │ empty ──► config-provider
  L1 (3)                          ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │ config-provider        qr-code        time-picker                   │
  └───────────────────────────────┬────────────────────────────────────┘
                                  │ config-provider ──► 39 个组件
  L2 (25)                         ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │ anchor  back-top  badge  breadcrumb  button  cascader  checkbox     │
  │ collapse  flex  grid  input-number  layout  mentions  message       │
  │ notification  radio  select  skeleton  space  tabs  tag  tooltip    │
  │ tour  tree  tree-select                                             │
  └───────────────────────────────┬────────────────────────────────────┘
                                  │
  L3 (17)                         ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │ auto-complete  calendar  card  drawer  float-button  form  input    │
  │ menu  modal  pagination  popover  progress  rate  segmented        │
  │ slider  statistic  steps                                            │
  └───────────────────────────────┬────────────────────────────────────┘
                                  │
  L4 (7)                          ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │ avatar  color-picker  dropdown  list  popconfirm  table  timeline   │
  └───────────────────────────────┬────────────────────────────────────┘
                                  │
  L5 (1)                          ▼   transfer
```

**枢纽组件（`unblocks` = 含传递的下游数，取自 `components.json → derived`）**

```
empty ──────────► 51   ← 必须先做：config-provider 的 defaultRenderEmpty 依赖它
config-provider ► 50   ← 几乎全部组件都吃它的 context（直接下游 39 个）
tooltip ────────► 15   ← Popover / Slider / Rate / Steps / Form / Menu 的底座
select ─────────►  6   ← AutoComplete / Calendar / Pagination
spin ───────────►  4   ← List / Mentions / QRCode / Table
skeleton ───────►  4   ← Card / Drawer / Modal / Statistic
popover ────────►  3   ← Avatar / ColorPicker / Popconfirm
pagination ─────►  3   ← List / Table / Transfer
```

**这与分组泳道正交**：`empty` 在「数据展示」组，却阻塞「其他」组的 `config-provider`；
`tooltip` 在「数据展示」组，却是「导航」组多个组件的前置。
**所以并行必须同时看 DAG（`blockedBy`）和泳道（`workstream`）—— 只看一个都会出错。**

---

## 5. 图四 · 可并行任务列表（当前批次）

```
node registry/tools/next-task.mjs --parallel
```

**当前输出（2026-09-22 刷新：17 个可同时开工，ready 35 / 92）**

```
WS-X · 横切基建
   X:build-output-contract        裁决并落实包级构建产物契约（解锁 87 个下游）
   X:ci-pipeline                  CI 流水线与门禁
WS-F · 表单与选择引擎
   FND:picker                     @apollo-design/picker（解锁 3 个下游）
WS-2 · 布局组件
   COMP:splitter                  Splitter
WS-3 · 导航组件
   COMP:anchor                    Anchor
   COMP:breadcrumb                Breadcrumb
WS-4 · 数据录入组件
   COMP:checkbox                  Checkbox（解锁 1 个下游）
   COMP:radio / COMP:switch / COMP:upload
WS-6 · 反馈组件
   COMP:message / COMP:notification / COMP:drawer
WS-5 · 数据展示组件
   COMP:carousel / COMP:descriptions / COMP:listy
WS-7 · 其他组件
   COMP:app / COMP:tour
```

> 组件期任务随 DAG 动态变化 —— **以 `node registry/tools/next-task.mjs --parallel`
> 的实时输出为准**，本节只是快照。

### 波次推进图（纵轴 = 泳道，横轴 = 波次）

```
泳道      W1              W2                 W3        W4      W5   W6    W7   W8
────────────────────────────────────────────────────────────────────────────────
WS-A  ██ utils       · test-utils                    ├─ 组件（按分组）──────────┤
      ██ (收口被挡)
WS-B  ██ theme+icons                                 ├─ 组件（按分组）──────────┤
WS-C  ░░ position:poc  ██ position      ██ overlay    ├─ 浮层类组件 ────────────┤
WS-D  ░░ motion:poc    ██ motion+portal               ├─ 反馈类组件 ────────────┤
WS-E                   ██ a11y+virtual-list           ├─ 重型数据组件 ──────────┤
WS-F                   ██ form-core+picker            ├─ 数据录入类组件 ────────┤
WS-G  ██ locale                                       ├─ 组件（按分组）──────────┤
WS-X  ██ build-contract  · a11y-pipeline  · docs-site  ██ visual-infra ─────────┤
      ██ ci-pipeline
────────────────────────────────────────────────────────────────────────────────
██ 可开工   ░░ PoC（验证，不是完整实现）   ├─┤ 组件期由 DAG 自动解锁
```

### 各波次的并行度

| 波次 | 单元数 | 涉及泳道 | 理论并行度 |
|---|---|---|---|
| W1 | 9 | 6 | **6**（受泳道数限制） |
| W2 | 7 | 6 | **6** |
| W3 | 1 | 1 | 1 |
| W4 | 20 | 8 | **8** |
| W5 | 4 | 4 | 4 |
| W6 | 26 | 8 | **8** |
| W7 | 17 | 7 | 7 |
| W8 | 8 | 5 | 5 |

> 理论并行度 = 该波次涉及的泳道数。实际并行度还受执行者数量与 `maxParallel` 限制。

---

## 6. Phase 1 任务（✅ 已完成）

| # | 任务 | 产出 |
|---|---|---|
| 1 | 提取 antd 6.6.4 事实 | `registry/source/antd-6.6.4.raw.json`（72 组件 / 48 依赖 / Token 34-140-222-517 / 75 locale） |
| 2 | 分析 `@rc-component/util@1.13.0` 契约 | `docs/foundation/rc-util-contract.md`（165 条 import 逐条对照） |
| 3 | 定包结构与分层 | `ARCHITECTURE.md`（13 包 / L0–L3 / R1–R6） |
| 4 | 定兼容性分级与映射规则 | `COMPATIBILITY.md`（5 层 / 命名 / 插槽 / v-model / ref / hooks→composables） |
| 5 | 建测试体系 | `TESTING.md`（七层 / Vitest 5 多 project / 覆盖率阈值） |
| 6 | 建 Registry | `registry/{components,dependencies,tokens,foundation,workstreams}.json` + 5 个工具 |
| 7 | 建依赖 DAG | 组件 82 条运行时边 / 类型边 71 条 / 最大层级 5（E4 保证无环） |
| 8 | 实现 `@apollo-design/utils` | 37 源文件 / 3611 行 / 131 导出 / 643 测试 / 98% 语句覆盖 |
| 9 | 建长期开发规范 | `WORKFLOW.md` / `COMPONENT-RULES.md` / `AGENTS.md` / 本文档 |

**Phase 1 的遗留**：5 个门禁缺陷（D1–D5），其中 D4/D5 已修，D1–D3 待裁决 —— 见 §10。

---

## 7. Phase 2 任务（W1–W3）

### W1 · 地基 + 风险 PoC（9 个单元）✅ 完成

| 单元 | 泳道 | 内容 | 阻塞 |
|---|---|---|---|
| `X:build-output-contract` | WS-X | **裁决并落实构建产物契约** | 需用户裁决（阻塞 13 个包的 `pkg` 维度） |
| `X:ci-pipeline` | WS-X | CI 跑 `registry:check` / `lint` / `test` / `vue-tsc` | 无 |
| `FND:utils` | WS-A | 已完成代码，仅剩 `pkg` 收口 | `build-output-contract` |
| `FND:test-utils` | WS-A | 共享测试契约（mount/demo/a11y/focus/rtl/dom-contract/theme） | `build-output-contract` |
| `FND:theme` | WS-B | Seed→Map→Alias→Component 完整派生链 + CSS 变量 | `prefix-cls-default` `zero-runtime-mode` |
| `FND:icons` | WS-B | 从 `@ant-design/icons-svg` 生成 Vue 图标组件 | `build-output-contract` |
| `FND:locale` | WS-G | 从 antd 的 75 个语言包生成 | `build-output-contract` |
| `FND:position:poc` | WS-C | **AR1**：纯函数验证 12 个对齐点 + 翻转 + 溢出 + 箭头 | 无 |
| `FND:motion:poc` | WS-D | **AR2**：验证 collapse/slide/zoom/fade/move 五类语义 | 无 |

**退出条件**：utils 六维全 done；theme 的 Token 管道可产出 CSS 变量；icons/locale 生成完成；
两个 PoC 给出明确结论（`pocStatus = done`）。

> ✅ 已全部满足（AR1/AR2 的 PoC 结论与实现均落在 `packages/position` / `packages/motion`）。

### W2 · 能力层（7 个单元，全部只依赖 utils）✅ 完成（picker 收口中）

`FND:motion` `FND:portal` `FND:position` `FND:a11y` `FND:virtual-list` `FND:form-core` `FND:picker`

**这 7 个包彼此完全独立，可在 6 条泳道上同时推进。**

### W3 · 组合层（1 个单元）✅ 完成

`FND:overlay` —— 依赖 portal + position + a11y，是 15 个浮层类组件的共同前置。

---

## 8. Phase 3 任务（W4–W8）

| 波次 | 单元 | 代表组件 | 说明 |
|---|---|---|---|
| **W4** | 20 | `empty` `typography` `divider` `spin` `alert` `switch` `upload` `date-picker` … | **用这批跑通 G0→G14 全流程**，验证流水线本身可重复 |
| **W5** | 4 | `config-provider` `qr-code` `time-picker` | + `X:a11y-pipeline` |
| **W6** | 26 | `button` `select` `tooltip` `tree` `tabs` `tag` `space` `grid` `radio` `checkbox` … | **最大产能释放点**；+ `X:docs-site` |
| **W7** | 17 | `input` `form` `menu` `modal` `drawer` `pagination` `card` `slider` `steps` `rate` … | 数据录入与反馈的主体 |
| **W8** | 8 | `table` `transfer` `dropdown` `list` `timeline` `avatar` `color-picker` `popconfirm` | 最重的一批，含全项目最大的 `table` |

> 波次归属由 `max(4 + dagLevel, 最晚 foundation 依赖波次 + 1)` 推导 ——
> 一个组件即使 DAG 层级很低，只要它依赖 `overlay`，也不会早于 W4 开工。

**每批的退出条件**见 `registry/source/workstreams.mjs → WAVES`，或：

```
node registry/tools/gen-workstreams.mjs --wave W6
```

---

## 9. Phase 4 任务（W9）

- 文档站上线（`docs-site-framework` 裁决后）
- SSR 验证（零运行时架构天然支持，但需实测）
- 按需引入（依赖 `build-output-contract` 的裁决）
- 主题市场 / 自定义主题编辑器
- antd → apollo 的迁移工具与 codemod
- 发布 0.1.0

---

## 10. 持续开发机制

### 10.1 每次执行的标准动作

```bash
# 1. 看当前能做什么（唯一权威来源）
node registry/tools/next-task.mjs --parallel

# 2. 做（G1 → G14，见 WORKFLOW.md）

# 3. 更新 registry（进度只有写进 registry 才算数）

# 4. 三道门禁全绿
pnpm run registry:check     # E1–E18
pnpm run lint               # vue-tsc + biome
pnpm run test               # unit / dom-contract / a11y / theme

# 5. 汇报：做了什么 / 哪些维度置 done / 解锁了什么 / 卡在哪
```

### 10.2 DAG 如何自动选任务

```
components.json（组件 DAG + 状态）  ─┐
foundation.json（包依赖 + 状态）     ├─► gen-workstreams.mjs ─► workstreams.json
source/workstreams.mjs（编排规则）  ─┘                              │
                                                                   ▼
                                    status 求解（done/ready/blocked/waiting-decision）
                                                                   ▼
                                    批次求解（无跨泳道 exclusive 冲突 + 泳道并发上限）
                                                                   ▼
                                    next-task.mjs --parallel
```

**没有"我记得接下来该做 X"这回事。** 每次都重新推导。

### 10.3 门禁（CI 必须全绿）

| 门禁 | 命令 | 检查 |
|---|---|---|
| Registry 一致性 | `registry:check` | 生成→刷新→校验，E1–E18 |
| 类型 | `vue-tsc --noEmit` | 含 `noUncheckedIndexedAccess` |
| 格式/静态 | `biome check .` | 2.5.13 schema |
| 测试 | `test:unit` `test:dom` `test:types` | 覆盖率 95/90/95（基础设施） |
| React 痕迹 | E11 | 产物中不得出现 React |

### 10.4 阻塞如何被追踪

```
遇到跨切面问题
   └─► 写进 registry/source/open-decisions.mjs（问题/选项/代价/建议/影响面）
         └─► foundation.json 的 blockedBy 引用该 id
               └─► workstreams.json 把受影响的 Item 标 cannotFinish
                     └─► next-task.mjs --parallel 用 ⚠ 提示"可以开工但收不了口"
                           └─► E17 保证引用完整、裁决后必须解除
```

**阻塞不活在对话里。**

---

## 11. 当前状态与下一步

> **快照时间：2026-09-22**（layout 收口后）。数字由工具推导，刷新命令见 §12。

### 11.1 总览

```
92 个 Work Item | 组件 20/72 | foundation 12/13 completed（picker 收口中）
当前 ready 35（可并行开工 17）| verify:full 四道门禁全绿（127 检查 FAIL 0）
```

### 11.2 已完成的成果（⚠️ 防重复清单 —— 不要再做这些）

**Phase 2 基础设施（12/13 completed，六维全绿）**

| 包 | 状态 | 备注 |
|---|---|---|
| utils / theme / icons / locale / test-utils | ✅ | L0 地基（icons 848 个 Vue 图标、theme 完整派生链 + CSS 变量） |
| motion / portal / position / a11y / virtual-list | ✅ | L1 能力层（AR1/AR2 架构风险已用真实实现证伪） |
| form-core / picker | ✅ / 收口中 | L2 领域引擎 |
| overlay | ✅ | L3 组合层（15 个浮层类组件的共同前置） |

**Phase 3 组件（20/72，每组件 G0→G14 全流程 + 七层测试 + verify:full 四道全绿）**

```
empty → config-provider → button · space · flex · grid · divider · typography
        alert · skeleton · spin · result · tag · badge · watermark · border-beam
        statistic · affix · back-top · layout
```

（`empty` / `config-provider` 两个枢纽已就位；组件期由 `next-task.mjs` 按 DAG 派发，
每完成一个组件其七层测试与视觉基线随提交入库 —— **重复实现前先查
`registry/components.json` 的 `status` 与 `packages/ui/src/<comp>/` 是否存在**。）

### 11.3 已知遗留与「不要再排查」清单

以下问题**已定位、已登记、非回归** —— 后续会话看到红灯时先对照这里，不要重复排查：

| 问题 | 状态 | 去处 |
|---|---|---|
| typography semantic 视觉 3 张（React 130px vs Vue 90px） | 已定位：antd `ellipsis: { expandable: 'collapsible' }` 的展开按钮行未复刻 | tag 会话登记；实现 expandable 后消除 |
| typography 的 `ellipsis` 展开按钮 | 未实现（antd 6.6.4 新能力） | typography 收口遗留 |
| demo 里的 Menu / Breadcrumb / Modal / Drawer | 用等价原生结构替换（组件未落地），对应组件落地后换回 | 各 demo 文件头有登记 |
| `pnpm test` 全量 icons 用例 5s 超时 | 已修：该用例显式 120s | icons semantic.test.ts |
| 全量跑偶发 unhandled error（组件残留 timer） | 已修：`enableAutoUnmount(afterEach)` | vitest.setup.ts |
| theme baseline `borderRadiusCircle` | 已修：白名单登记（spin 的有意扩展） | theme baseline.test.ts |

**经典错误沉淀**：`docs/COMPONENT-CHECKLIST.md` §六（#1–#37，最近在顶部）——
每类「踩过的坑 + 抓到它的层 + 对策」。写组件前先读一遍，比踩完再查省一个 Gate。

### 11.4 下一步（按优先级）

1. **裁决 `build-output-contract`**（仍阻塞全部 13 个包的 `pkg` 维度与 B6）
2. `X:ci-pipeline`（无阻塞，让门禁在 CI 上先存在）
3. 组件期继续：`node registry/tools/next-task.mjs` 派发（当前优先建议
   `checkbox`（解锁 1 个下游）→ `anchor` / `breadcrumb` / `message` / `drawer`）
4. `FND:picker` 收口（最后一个未 completed 的 foundation 包）

## 12. 相关命令速查

```bash
# 任务
node registry/tools/next-task.mjs                    # 下一个一个任务
node registry/tools/next-task.mjs --parallel         # 当前全部可并行任务
node registry/tools/next-task.mjs --workstream WS-C  # 单条泳道
node registry/tools/next-task.mjs --foundation       # foundation 包进度
node registry/tools/next-task.mjs --component button # 单个组件详情
node registry/tools/gen-workstreams.mjs --wave W2    # 单个波次

# 进度
node registry/tools/foundation-status.mjs            # 13 个包的六维进度
node registry/tools/foundation-status.mjs --package utils
node registry/tools/foundation-status.mjs --verify   # 跑测试并写入实测结果

# 校验
pnpm run registry:check                              # 生成 + 刷新 + E1–E18
pnpm run lint && pnpm run test
```
