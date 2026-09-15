# MEMORY.md — 项目长期约定

> `@apollo-design/ui` 的跨会话长期约定。日常进展写在 `YYYY-MM-DD.md`。

---

## 项目本质

用 **Vue 3 + TypeScript** 重新实现 Ant Design。
**Ant Design React 是兼容性规格，不是代码来源。**

兼容目标版本：**antd 6.6.4**（锁定在 `registry/components.json` 的 `antdVersion`）

---

## 必须遵守的核心约定

### 1. 禁止事项（详见 `AGENTS.md` §1）

禁止引入 React runtime ｜ 禁止复制 antd 实现 ｜ 禁止机械翻译 ｜ 禁止模拟 React 生命周期 ｜ 禁止依赖 `@rc-component/*` ｜ 禁止 CSS-in-JS ｜ 禁止改测试预期让红灯变绿 ｜ 禁止硬编码视觉值 ｜ 禁止 `any` ｜ 禁止跨层反向依赖 ｜ 禁止跳过 Registry 更新

### 2. 事实来源优先级

```
用户指令 > 本仓库规范文件 > registry/*.json > antd 固定版本的产物与源码 > antd 官方文档 > 模型先验知识
```

**禁止凭记忆描述 antd 的 API 或行为。** 必须读产物或源码。
参考路径（本地缓存，不提交）：`/tmp/antd-src/package/`（产物）、`/tmp/antd-repo/ant-design-master/`（源码+测试+文档）。
可用 `node registry/tools/extract-antd-facts.mjs --download` 重新获取。

### 3. 任务来源

Agent 不允许自己挑组件。必须运行：

```bash
node registry/tools/next-task.mjs
```

**注意**：组件清单的 `blockedBy` 只表达「组件依赖组件」，**不表达「组件依赖 foundation 包」**。
所以 `next-task` 会推荐 `empty`(P0)，而它依赖尚为骨架的 `theme`。此时它会打印显式告警 ——
**必须服从告警，先做 foundation 包**，不要在没有地基的情况下做组件（那是虚假进度）。
硬过滤用 `--require-foundation`。

### 4. 一轮一个组件

「继续推进」= 完成一个组件的 G0→G14 全部 14 道 Gate，然后停下汇报。
不允许一轮批量推进，不允许"顺手"做下一个。

### 5. foundation 包进度（`registry/foundation.json`）

72 个组件建立在 10 个 foundation 包之上。组件标记 `completed` 而其 foundation 依赖只有骨架
= **虚假进度**。因此 foundation 进度单独追踪，且是组件开工的前置条件。

**两个顺序字段，语义不同**：

- `phase2Order` = 推进顺序，**含 AR1/AR2 的 PoC 槽位**，允许早于依赖包（前提 `pocRequired: true`）
- `derived.implOrder` = 严格拓扑序。回答「可以开始完整实现的下一个」

**`testLayers` 里的 `n/a` 必须有 `layerNotes` 说明架构依据**（E16 强制）。
这条是「不降低验收标准」的机械保障 —— 不允许用 `n/a` 掩盖未做。

**`openDecisions` 是「项目卡在什么问题上」的登记处**，`blockedBy` 只能引用这里的 id（E17）。
裁决后把 `status` 改成 `decided`，E17 会立刻报出仍引用它的包。

`status: completed` 必须同时满足 5 项：6 个维度全 `done`/`n/a`、7 个测试层全 `done`/`n/a`、
`thresholds.met === true`、`build.status === 'passing'`、`blockedBy` 为空。

---

## 架构约定

### 包分层（依赖只能同层或更低层）

```
L3  ui
L2  form-core / picker
L1  motion / portal / trigger / virtual-list
L0  utils / theme / icons
```

### 包边界判据

> 能力只有在「**消费者 ≥ 2** 且 **无视觉语义**」时才升级为 `@apollo-design/xxx` 独立包。
> 否则留在 `packages/ui/src/<component>/engine/`。

**因此不照搬 antd 的 37 个 rc 包，只建 10 个。**

### 可复用的框架无关包（不要重写）

`@ant-design/icons-svg` ｜ `@ant-design/colors` ｜ `@ant-design/fast-color` ｜ `dayjs` ｜ `scroll-into-view-if-needed`

这 5 个包的 `peerDependencies` 为空，不含 React 代码，复用是达成一致性的最省成本路径。

### 组件间的共享代码

**共享 context 与工具必须放在 `packages/ui/src/_internal/` 叶子模块。**
组件之间禁止互相 import 组件目录（否则会复现 antd 的 4 组假循环依赖）。

### 样式方案

**零运行时 CSS 变量，唯一模式。** 组件样式是静态 CSS，所有可变值引用 `var(--apollo-*)`。
Token Runtime 只负责计算并注入变量。不提供 CSS-in-JS 路径。

---

## 兼容性约定

### 五个层级

L1 API Shape ｜ L2 Behavior ｜ L3 DOM Contract ｜ L4 Visual ｜ L5 Accessibility

**L1 与 L2 必须完全对齐**（除已登记差异）。L5 不得低于 antd。

### 命名

- **Props 名与 antd 完全一致**（`type` 不改 `variant`；`size` 保留 `middle` 不改 `medium`）
- 组件全局注册加 `A` 前缀（`<a-button>`），同时支持按需导入（`<Button />`）
- 事件：`onClick` → `@click`；原生 DOM 事件经 `$attrs` 透传，**不通过 emit 声明**
- 受控：`value`+`onChange` → `v-model:value`（v-model 参数名沿用 React 的受控 prop 名）
- render prop → 作用域插槽，**同时兼容**函数 prop（prop 优先）
- 类型名与 antd 一致（`ButtonProps` / `SelectProps`）

### 差异登记

任何 L1-L5 差异必须登记到 `COMPATIBILITY.md` §9（含编号 D1、D2...），未登记视为 BUG。
当前已登记 7 项（D1-D7）。

---

## 工具链

| 命令 | 作用 |
|---|---|
| `node registry/tools/next-task.mjs` | ★ 下一个任务（唯一权威）；`--foundation` 看 foundation 进度 |
| `node registry/tools/foundation-status.mjs` | ★ foundation 包进度；`--package <dir>` / `--verify` / `--check` |
| `node registry/tools/gen-registry.mjs` | 刷新 Registry（**保留进度字段**） |
| `node registry/tools/validate-registry.mjs` | **16 项**规范检查（E1-E17） |
| `node registry/tools/extract-antd-facts.mjs` | 重新提取 antd 事实 |
| `node registry/tools/scaffold-packages.mjs` | 生成 package 骨架（含分层校验；导出 `PACKAGES` 供其他工具复用） |
| `node registry/tools/gen-registry.mjs --print-dag` | 打印依赖 DAG 与推荐顺序 |
| `pnpm run registry:check` | gen → foundation --check → validate，CI 用 |

**派生字段禁止手工编辑**（下次生成会被覆盖）。**进度字段由 Agent 写入，生成器会保留。**

---

## 工具链的坑（实测，别重踩）

1. **本环境 Bash 的 `grep` 对某些文件会静默返回空**（如 `scaffold-packages.mjs`、`gen-registry.mjs`），
   不报错也不输出。**一律用 Grep 工具，不要用 Bash grep 做代码搜索。**
2. **`biome-ignore` 必须紧贴目标行** —— 中间不能隔其他注释行；reason 要在同一行。
   多行说明写在 ignore 之前，单行 `biome-ignore` 放最后。
3. **不要盲信 lint 的自动修复。** `noConfusingVoidType` 建议把 `() => void | Cleanup` 改成
   `undefined | Cleanup` —— `tsc --strict` 实测证明这**会破坏 API**（TS 把 `() => {}` 推断为
   `() => void`，而 `void` 不可赋值给 `undefined`）。改任何类型前先用 `tsc` 验证。
4. **biome 2.x 的配置键名变了**（2.0.0 的写法在 2.5 报错）：`files.ignore` → `files.includes`
   （用 `!` 前缀排除）、`overrides[].include` → `includes`、`linter.rules.recommended` → `preset`。
5. **`passWithNoTests` 是 vitest 的根级选项**，写进 `projects[]` 里不生效。只能放 CLI 或根 `test`。
6. **新增生成的 registry 文件时，要同步加进 `biome.json` 的忽略列表**，否则 biome 会重排它、
   让 `--check` 永久失败。

---

## 环境约束

- Node **>= 22.12**（managed: `~/.workbuddy-ai/binaries/node/versions/22.22.2-2/bin/node`）
- pnpm **12.4.2**，`.npmrc` 设了 `hoist=false`（让分层规则可被强制）
- TypeScript **锁定 5.9.x**（`unbuild@3.6.1` peer 要求 `^5.9.2`；TS 7 虽已发布但构建链未支持）
- 测试用 **Vitest 5**（不用 Jest）
- 视觉回归用 **Playwright + pixelmatch**（不用 Cypress）

---

## 关键风险（需在对应组件开发前验证）

| # | 风险 | 验证时机 |
|---|---|---|
| AR1 | `trigger` 定位要做到像素级一致 | **开发 Tooltip 前必须先做 PoC** |
| AR2 | `motion` 需覆盖 collapse/slide/zoom/fade/move 五类语义，Vue 内置 `<Transition>` 不足以表达 `motionDeadline`/`motionLeaveImmediately` | **开发 Modal 前必须先做 PoC** |
| AR3 | `picker` 引擎的状态机复杂度 | 开发 DatePicker 前 |
| AR4 | 零运行时 CSS 下 `classNames`/`styles` 与 Token 变量的优先级组合 | 随 config-provider 开发 |
| AR6 | Vue 泛型组件对 `Table<RecordType>` 的表达力 | 开发 Table 前 |

---

## 待用户裁决

全部 9 项已登记进 `registry/foundation.json` 的 `openDecisions`（含选项、取舍、建议、影响面）。

| # | 问题 | 阻塞范围 |
|---|---|---|
| Q1 | `prefixCls` 默认值用 `apollo` 还是 `ant` | theme 收口 + 全部 72 组件的 DOM 契约与视觉基线 |
| Q2 | 是否接受零运行时 CSS 为唯一模式（不提供 CSS-in-JS 路径） | theme 收口 |
| Q3 | 是否在 Phase 2 就提取 `table-core` / `tree-core` 独立包 | 不阻塞 foundation |
| Q4 | Carousel 自研还是用 `embla-carousel` | 不阻塞 foundation |
| Q5 | 文档站点用什么框架 | 不阻塞 foundation |
| Q6 | 视觉回归基线截图是否纳入 git | 不阻塞 foundation |
| Q7 | 接受 `pickAttrs` 事件键重写偏差（`onKeyDown` → `onKeydown`）吗 | utils 契约 + COMPATIBILITY 登记 |
| Q8 | 是否在测试环境固定 `useId` 输出 | 仅测试写法 |
| **Q9** | **包构建产物契约：`exports` 的 `./es/*` 与 `./css/*` 是否真正落实** | **全部 10 个 foundation 包的 `pkg` 维度 —— 当前唯一阻塞 `utils` 收口的项** |

Q9 背景：`ARCHITECTURE.md` 第 123/276 行声明产物为「`es/`（保留模块结构）+ `dist/`（单文件，可选）」，
但 scaffold 生成的 `build` 是裸 `unbuild`（只出 `dist/`）。结果是 `exports` 声明了不存在的子路径，
`unbuild` 退出码 1，`pnpm -r build` 全仓不可用。建议方案 B：`es/` 用 mkdist + `dist/` 用 unbuild。

---

## 2026-09-16 · 架构规划轮（不写实现代码）

用户要求：暂停实现，切换到「总体架构规划 + 并行任务拆解」模式。本轮产出全部是规划与工具，没有新的组件/包实现代码。

### 包结构变更（10 → 13）

| 变化 | 说明 |
|---|---|
| `trigger` 删除 | 拆为 `position`（L1，纯几何，AR1 的 PoC 可用纯函数验证）+ `overlay`（L2，生命周期） |
| 新增 `a11y` | L1，28 个消费者；L5 测试层的落点 |
| 新增 `locale` | L2，75 个语言包，生成物 |

`packages/trigger/` 已删除，`ui` 的依赖、`tsconfig.json` paths、`vitest.config.ts` aliases 已同步。

### 新增工具与文件

- `registry/source/open-decisions.mjs` —— 开放决策的**种子源**。之前 openDecisions 是 foundation.json 的纯保留字段，文件丢失即永久消失；现在内容在源码里，只有 status/decision 从 json 合入。11 项（9 待裁决 + 2 已裁决记录）。
- `registry/source/workstreams.mjs` —— 并行编排规则：8 个冲突集（5 exclusive / 3 serialized）、15 条泳道、10 个波次、5 个横切 Item。
- `registry/tools/gen-workstreams.mjs` → `registry/workstreams.json` —— 92 个 Work Item，成员/状态/批次**全部推导**，不手工维护。
- `next-task.mjs --parallel` / `--workstream WS-C` —— 并行视图。
- `validate-registry.mjs` E18 —— workstreams 一致性（覆盖 13 包 + 72 组件、无环、批次合法、泳道归属与 group 一致）。已注入 3 个故障反向验证，3/3 捕获。

### 三种"卡住"必须分清（重要）

`blocked`（依赖未完成）/ `waiting-decision`（hardBlock 决策）/ `ready` + `cannotFinish`（软决策，可以开工但收不了口）。
第一版实现把软决策也标成 blocked，导致 9 个本可开工的任务被报成不能开工。

### 冲突集互斥只跨泳道

同一泳道内若也按 exclusive 冲突集互斥，`maxParallel` 会把泳道压成同时只能跑一个 —— 那是把「限流」误实现成「禁用」。

### 波次公式

组件波次 = `max(4 + min(dagLevel, 4), 最晚 foundation 依赖波次 + 1)`。13 个 foundation 包只需 3 个波次（W1/W2/W3），W2 的 7 个包彼此完全独立。

### 文档

`ARCHITECTURE.md`（重写，13 包）/ `WORKFLOW.md`（重写，DoD + 并行协议）/ `COMPATIBILITY.md`（§9 差异登记表扩为 4 分类 + 12 条已登记差异）/ `COMPONENT-RULES.md`（新增 §12 DoD→Registry 字段映射）/ `ROADMAP.md`（新增，含 4 张图）。

### 门禁缺陷遗留

D1 构建产物契约（=Q9，待裁决）/ D2 `tests/build/run.mjs` 缺失 / D3 `tsconfig.build.json` 悬空。D4 biome、D5 空 a11y/theme project 已修。

### 用户明确要求

**规划完成后等待确认，不要自行进入大规模组件实现。**
