# ADR 0003：依赖替换采用「复用 / 独立包 / 内聚 / 丢弃」四分类

- **状态**：已接受
- **日期**：2026-09-15
- **相关**：`ARCHITECTURE.md` §2.2/§2.3、`registry/dependencies.json`、`registry/source/rc-map.mjs`

---

## 背景

Ant Design 6.6.4 有 **48 个运行时依赖**，其中 **37 个是 `@rc-component/*`**。

我们面对的问题不是"用什么替代 rc-trigger"，而是"**如何系统地、可审计地为 48 个依赖逐个做出替代决策，并保证决策可被后续 Agent 复用**"。

如果只做一次性的口头决策（"trigger 我们自己写"），会出现三个问题：

1. **不一致**：不同的人/Agent 对同类依赖做出不同决策（一个自己写、一个引第三方、一个复制代码）
2. **不可审计**：三个月后没人记得为什么 `clsx` 被丢掉了
3. **不可维护**：升级 antd 版本时无法评估影响面

## 决策

**建立四分类决策框架，并把每个依赖的决策写成机器可读的数据。**

| 策略 | 判定条件 | 数量 |
|---|---|---|
| **`reuse`** 直接复用 | 该包**框架无关**（纯数据/纯算法），`peerDependencies` 不含 React，**且不属于 Ant Design 生态**（见 ADR 0004） | 2 |
| **`generate`** 构建期固化 | 来自 Ant Design 生态、且内容是**数据** → 只能作构建期数据源 | 1 |
| **`port`** 移植 + 差分验证 | 来自 Ant Design 生态、且内容是**算法** → 移植进 `@apollo-design/*`，上游降级为测试 Oracle | 2 |
| **`apollo`** 独立包承接 | 满足 ADR 0002 的包边界判据（消费者 ≥2 且无视觉语义） | 13 |
| **`in-ui`** ui 内部承接 | 消费者 ≤1，或能力与该组件的视觉语义强绑定 | 31 |
| **`drop`** 不需要 | Vue 原生已覆盖，或仅服务 React/构建工具 | 5 |

决策数据落在 `registry/source/rc-map.mjs`，生成后进入 `registry/dependencies.json`。
每条记录必须包含：`pkg` / `kind` / `capability` / `strategy` / `target` / `foundationPkg` / `rationale` / `risk`。

**关键要求：`capability` 必须写"它真正解决的问题"，而不是"它叫什么"。**

这是本 ADR 最重要的约束。例如：

- ❌ `rc-trigger` → "触发器"
- ✅ `rc-trigger` → "浮层定位对齐（含翻转/自适应）、箭头、滚动容器跟随、点击/悬停/聚焦触发时机、`getPopupContainer`、延迟显隐"

只有写清能力，才能判断 Vue 生态里是否已有平替、是否值得自己实现、以及我们实现到什么程度算完成。

## 结果

### `reuse`：直接复用 2 个框架无关包（重要发现）

> ⚠️ **2026-09-18 收紧**（ADR 0004）：本表原有 5 项，其中 3 个 Ant Design 生态包
> 已改为 `generate` / `port` —— 它们框架无关，但**不能进用户依赖树**。
> 下面的分析逻辑保留原样，只是判定条件补了一维「发行关系」。

| 包 | peer 要求 | 用途 | 验证方式 | 现状 |
|---|---|---|---|---|
| `dayjs` | **无** | 日期处理 | 查 npm registry 的 `peerDependencies` 为空 | ✅ 直接复用 |
| `scroll-into-view-if-needed` | **无** | 滚动到可视区 | 同上 | ✅ 直接复用 |
| `@ant-design/icons-svg` | **无** | 800+ 图标的原始 SVG 数据 | 同上 | 🔄 改为 `generate`（构建期固化） |
| `@ant-design/colors` | **无** | 预设色板生成算法 | 同上 | 🔄 改为 `port`（移植 + 差分验证） |
| `@ant-design/fast-color` | **无** | 颜色解析与转换 | 同上 | 🔄 改为 `port`（移植 + 差分验证） |

**这是分析过程中最有价值的发现**：antd 生态里混着"框架耦合包"和"框架无关包"。把它们区分开后，可以复用 5 个包，从而：

- 图标获得**像素级一致**（同一份 SVG 数据）
- 色板梯度与 antd **完全一致**（同一套算法）
- 日期 API 与 antd **完全兼容**（antd 的 `value` 就是 dayjs 对象）
- 省下大量重写与验证成本

复用的**前提**是这些包不含任何 React 代码，因此不违反 `AGENTS.md` H1/H5/H6。

**但这不充分。** 2026-09-18 的复审发现：「框架无关」只回答了「能不能复用」，
没有回答「该不该出现在用户的依赖树里」。三个 Ant Design 生态包被直接写进了
`dependencies`，导致 `npm install @apollo-design/icons` 会连带安装 `@ant-design/icons-svg`。
判定条件因此补上第三维 —— **发行关系**，并落地为 R7 与 E19，详见
[ADR 0004](./0004-zero-antd-runtime-dependency.md)。

### `apollo`：13 项升级为独立包

见 ADR 0002 的完整清单。

### `in-ui`：31 项留在 `ui` 内部

见 ADR 0002。

### `drop`：5 项丢弃

| 包 | 丢弃理由 |
|---|---|
| `@ant-design/cssinjs` | React 耦合；改用零运行时 CSS 变量（ADR 0001） |
| `@ant-design/cssinjs-utils` | 同上 |
| `@ant-design/react-slick` | React 组件移植，无法在 Vue 使用 |
| `clsx` | Vue 内置 `:class` 对象/数组语法已覆盖 |
| `@babel/runtime` | 构建期问题，Vite/esbuild 处理 |
| `@rc-component/context` | 它存在的唯一理由是解决 React context 全量重渲染；Vue 细粒度响应式下该问题不存在 |

## 理由

1. **"能力"而非"名字"是决策的正确粒度**
   `rc-trigger` 与 `rc-tooltip` 都含定位能力，`rc-dialog` 与 `rc-drawer` 都含焦点陷阱。按名字对应会重复实现；按能力对应能正确归并。

2. **机器可读是长期可维护的前提**
   决策写在 `.mjs` 里，生成到 `.json` 里，被 `gen-registry.mjs` 消费推导每个组件的 `needs`。新增组件时不需要人再判断"这个组件需要哪些 foundation 包"。

3. **`risk` 字段驱动验证顺序**
   `high` 风险的包（utils / motion / trigger / virtual-list / form-core / picker / select / table / tree / menu / cascader / dialog / color-picker / cssinjs）必须在对应组件开发**之前**通过 PoC 验证。这把架构风险显式化，而不是等实现到一半才发现。

4. **`rationale` 字段是给未来的自己和 Agent 看的**
   六个月后有人问"为什么不用 embla-carousel"，答案在数据里，不在某人的记忆里。

## 后果

### 正面

- 48 个依赖的替代决策全部可审计、可追溯、可被 Agent 自动消费
- 识别出 5 个可复用的框架无关包，显著降低实现与验证成本
- `risk` 字段让架构风险前置暴露
- 升级 antd 版本时，重跑提取 + 生成即可看到依赖变化的影响面

### 负面与代价

| 代价 | 缓解 |
|---|---|
| 需要维护 `rc-map.mjs`（新增 antd 依赖时要补录） | `gen-registry.mjs` 会在发现未覆盖的 rc 包时输出警告 |
| `capability` 描述需要人工写，有一定工作量 | 一次性成本；54 条已完成 |
| 部分决策需要实测才能定（QRCode、Carousel） | 已在报告中标注为「待确认项」，不假装已确定 |

### 影响的约束

- `AGENTS.md` H5：禁止依赖 `@rc-component/*` / `rc-*`
- `AGENTS.md` H6：禁止依赖 `@ant-design/cssinjs` 家族
- `ARCHITECTURE.md` §2.2：明确列出可复用的 5 个包
- `validate-registry.mjs` E11：构建产物中出现 React 痕迹即失败
- `validate-registry.mjs` E8：`needs` 中的包必须在 `dependencies.json` 中声明

## 备选方案为何被否决

- **找 Vue 生态平替（如用 Element Plus 的内部实现）**：
  违反"兼容 Ant Design"的核心目标 —— 平替的行为与视觉语义不同，会引入无法对齐的差异，且把兼容性问题从"实现"转移到"适配"，长期更贵。
  **唯一例外**：`@vueuse/core` 的 `useResizeObserver`（能力等价、行为简单、无视觉语义）。

- **逐个依赖临时决定**：不可审计、不一致、不可维护。

- **全部自己实现（不用任何第三方）**：对 `dayjs`、`@ant-design/icons-svg` 这类纯数据/算法包是纯粹的浪费，且必然引入不一致。

## 待验证

- [ ] QRCode 的第三方库选型（候选：`qrcode`、`qr-code-styling`）
- [ ] Carousel 自研 vs `embla-carousel`
- [ ] `@vueuse/core` 作为 `utils` 的依赖是否引入不必要的体积（需实测 tree-shaking 效果）
- [ ] `@ant-design/colors` / `fast-color` 在 Vue 构建链下的体积影响
