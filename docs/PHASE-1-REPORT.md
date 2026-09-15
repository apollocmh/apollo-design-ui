# Phase 1 报告：项目侦察、架构设计与长期开发规范

> 状态：**已完成，等待下一步指令**
> 兼容目标：**Ant Design 6.6.4**
> 产出：14 个规范/设计文件 + 4 个可执行工具 + 3 个机器可读 Registry 文件
> 本阶段**未实现任何组件**（符合「不要过度执行」要求）

---

## 零、本轮做了什么

| 类别 | 产出 |
|---|---|
| **规范** | `AGENTS.md` / `ARCHITECTURE.md` / `COMPONENT-RULES.md` / `COMPATIBILITY.md` / `WORKFLOW.md` / `TESTING.md` |
| **Registry** | `registry/components.json`（72 组件）/ `dependencies.json`（DAG + 54 项依赖决策）/ `tokens.json`（Token 清单）/ `schema.json` |
| **工具链** | `extract-antd-facts.mjs` / `gen-registry.mjs` / `next-task.mjs` / `validate-registry.mjs` |
| **兼容机制** | `tests/compat/`（fixture schema + 示例 + 设计） |
| **工作区** | `pnpm-workspace.yaml` / `package.json` / `tsconfig.json` / 11 个 package 骨架 |

**所有关于 Ant Design 的数字都来自实测提取**，不是记忆。提取脚本可重跑、可审计。

---

## 一、Ant Design 当前版本分析

### 1.1 版本事实

| 项 | 值 | 来源 |
|---|---|---|
| 最新版本 | **6.6.4** | npm registry |
| React peer 要求 | `>=18.0.0` | `package.json` |
| 运行时依赖总数 | **48** | 同上 |
| 其中 `@rc-component/*` | **37** | 产物扫描 |
| 组件目录数 | **80**（75 个组件相关 + 5 个基础设施） | `es/` 目录 |
| 真实组件数 | **72** | 扣除 `_util`/`locale`/`style`/`theme`/`version` 与 3 个别名目录 |
| 别名目录 | `qrcode`→`qr-code`、`row`/`col`→`grid` | 内容比对 |
| locale 语言数 | **75** | `es/locale/` |
| 演示文件数 | **1148**（`components/*/demo/*.tsx`） | 仓库扫描 |
| 测试文件数 | **641** | 仓库扫描 |
| 快照文件数 | **314** | 仓库扫描 |
| 组件 Token 组 | **70** | `theme/interface/components.d.ts` |
| 组件 Token 总数 | **517**（分布在 55 个组件） | 各 `style/{token,index}.d.ts` |

### 1.2 依赖命名空间迁移（重要）

antd v6 已把 `rc-*` 全面迁移到 **`@rc-component/*`** 命名空间。
**网上大量资料仍写 `rc-trigger` / `rc-select`，那些是 v5 及更早的包名，不能直接对照。**
本项目统一以 `@rc-component/*` 为准。

### 1.3 组件依赖集中度（决定地基优先级的关键数据）

| rc 包 | 被多少组件引用 | 结论 |
|---|---|---|
| `@rc-component/util` | **61** | 真正的地基，必须最先做 |
| `@rc-component/motion` | 12 | 基础设施 |
| `@rc-component/resize-observer` | 5 | 并入 utils 即可 |
| `@rc-component/select` | 3 | 单组件内部引擎 |
| `@rc-component/picker` | 3 | 值得独立成包（4 个消费者） |
| `@rc-component/tabs` | 3 | 留在 ui 内 |
| `@rc-component/trigger` | 3（直接） | 实际服务全部浮层组件 |
| `@rc-component/checkbox` | 2 | 留在 ui 内 |

### 1.4 基础设施实现事实

| 项 | antd 的做法 | 对我们的影响 |
|---|---|---|
| 样式方案 | CSS-in-JS（`@ant-design/cssinjs`）+ hash 类名 | **不采用**。见 §四 |
| v6 新增 | `theme.zeroRuntime`（构建期抽 CSS，需手动引入） | **采用为零运行时方案**，与 antd 演进方向一致 |
| CSS 变量模式 | `theme.cssVar`（since 5.12），默认前缀 `ant` | 采用，前缀改 `apollo`，变量名保持同构 |
| 主题算法 | `MappingAlgorithm`：Seed → Map 的纯函数 | 直接对应实现 |
| Token 元数据生成 | `scripts/generate-token-meta.ts`（typedoc 提取注释） | 借鉴：我们也生成机器可读 Token 清单 |
| 视觉回归 | Playwright 截图 + `sharp` 对齐 + `blazediff` 比对 + OSS 存储 + 4 个 CI workflow | 借鉴思路，简化存储（本地 + CI artifact） |
| 测试运行器 | Jest（主）+ Vitest（POC 迁移中，169 文件/1365 用例） | **我们直接用 Vitest**，跳过迁移阶段 |
| Agent 规范 | 仓库根有 `AGENTS.md` / `CLAUDE.md` / `DESIGN.md` / `.agents/skills/` / `.claude/skills/` | 借鉴：我们也建立 Agent 规范体系（`AGENTS.md` + 5 个配套文件） |

### 1.5 共享测试契约（antd 的 `tests/shared/`）

| 文件 | 作用 |
|---|---|
| `mountTest.tsx` | 渲染 → 更新 → 卸载不报错 |
| `accessibilityTest.tsx` | 遍历全部 demo 跑 jest-axe |
| `demoTest.tsx` | 遍历全部 demo 渲染无报错 |
| `focusTest.tsx` | 焦点获取/丢失/归还 |
| `rtlTest.tsx` | 镜像布局 |
| `rootPropsTest.tsx` | `rootClassName`/`rootStyle`/`prefixCls` 契约 |
| `imageTest.tsx` | 图像类组件的视觉测试 |

**这 7 个契约我们全部复刻**，并新增 `domContractTest` 与 `themeTest`。

---

## 二、推荐的 monorepo 结构

### 2.1 最终结构（11 个包）

```
@apollo-design/
├── L0  utils           通用工具集（替代 @rc-component/util 等）
├── L0  theme           Token Runtime + CSS 变量
├── L0  icons           Vue 图标组件（数据源 @ant-design/icons-svg）
├── L1  motion          CSSMotion 等价物
├── L1  portal          基于 Teleport 的挂载与层级管理
├── L1  trigger         浮层触发与定位
├── L1  virtual-list    虚拟滚动
├── L2  form-core       表单状态机 + 校验引擎
├── L2  picker          日期/时间面板引擎
├──     test-utils      共享测试契约（private）
└── L3  ui              组件库（72 个组件 + locale + style）
```

### 2.2 与用户初始设想的差异（附理由）

| 用户建议 | 决定 | 理由 |
|---|---|---|
| `overlay` | **改名 `trigger`** | 它真正解决的是「浮层定位 + 触发时机 + 对齐」，不是遮罩。对应 `@rc-component/trigger`（含原 rc-align 的定位逻辑）。用 `overlay` 会与 Modal/Drawer 的遮罩概念混淆 |
| `resize-observer` | **不独立，并入 `utils`** | 仅 5 个消费者，且 `@vueuse/core` 已有成熟实现。为它维护独立包不划算 |
| — | **新增 `virtual-list`** | 被 Select/Tree/Table/Cascader/TreeSelect 传递依赖，是真实的高复用能力 |
| — | **新增 `form-core`** | 是独立状态机 + 校验引擎，被 12+ 组件依赖其 context；且依赖 `@rc-component/async-validator` 需要一并重写 |
| — | **新增 `picker`** | 日历网格 + 区间选择状态机被 4 个组件复用 |
| — | **不创建 `table-core` / `tree-core` / `select-core` / `menu-core` / `tabs-core` / `steps-core` / `collapse-core` / `cascader-core` / `tree-select-core` / `checkbox-core` / `input-core` / `input-number-core` / `slider-core` / `switch-core` / `rate-core` / `segmented-core` / `pagination-core` / `upload-core` / `mentions-core` / `dropdown-core` / `dialog-core` / `drawer-core` / `notification-core` / `image-core` / `color-picker-core` / `progress-core` / `listy-core` / `tour-core` | **这是有意的决定，不是遗漏。** 它们各自只有 1~2 个消费者，独立成包属过度抽象。先内聚在 `ui/src/<component>/engine/`，等第二个消费者出现再提取 |

**抽象判据（唯一标准）**：

> 一个能力只有在 **≥2 个上层组件需要它**，且它 **不绑定任何具体组件的视觉语义** 时，才升级为 `@apollo-design/xxx` 独立包。

### 2.3 强制分层规则

```
L3 ui          → 可依赖 L0 / L1 / L2
L2 form-core / picker   → 可依赖 L0 / L1
L1 motion / portal / trigger / virtual-list → 可依赖 L0
L0 utils / theme / icons → 无内部依赖
```

| 规则 | 内容 |
|---|---|
| R1 单向 | 只能依赖同层或更低层 |
| R2 无环 | 包之间不得循环依赖 |
| R3 地基纯净 | L0 不得包含任何组件视觉语义 |
| R4 引擎无视觉 | L2 不得定义颜色/圆角/阴影，不得产出 CSS |
| R5 不重复造地基 | 组件不得自己实现已被 L0/L1/L2 覆盖的能力 |
| R6 显式声明 | 跨包导入必须在自身 `package.json` 声明（`.npmrc` 已设 `hoist=false`） |

---

## 三、Foundation Layer 设计

### 3.1 十个包的职责与风险

| 包 | 层 | 替代的 rc 包 | 风险 | 就绪标准 |
|---|---|---|---|---|
| `utils` | L0 | `@rc-component/util`、`resize-observer`、`mutate-observer`、`throttle-debounce`、`overflow`(检测) | 🔴 高 | 最小可用集：`is*` / `warning` / `dom` / `raf` / `scroll` / `throttle-debounce` / ResizeObserver 封装 |
| `theme` | L0 | `cssinjs`(Token 计算部分)、`cssinjs-utils`、`theme/` | 🔴 高 | 完整派生链 + 三算法 + cssVar 注入 + `getDesignToken` |
| `icons` | L0 | `@ant-design/icons` | 🟢 低 | 从 `@ant-design/icons-svg` 生成 Vue 组件的构建管线 |
| `motion` | L1 | `@rc-component/motion` | 🔴 高 | `CSSMotion` 等价物 PoC |
| `portal` | L1 | `@rc-component/portal`、`dialog`(挂载) | 🟡 中 | Teleport 封装 + 容器管理 + z-index 层级 |
| `trigger` | L1 | `@rc-component/trigger`、`tooltip`(定位) | 🔴 高 | 定位 PoC（AR1） |
| `virtual-list` | L1 | `@rc-component/virtual-list` | 🔴 高 | 接口契约（实现可延后） |
| `form-core` | L2 | `@rc-component/form`、`async-validator` | 🔴 高 | 接口契约（实现可延后） |
| `picker` | L2 | `@rc-component/picker` | 🔴 高 | 接口契约（实现可延后） |
| `test-utils` | 测试 | antd `tests/shared/` | 🟡 中 | 全部共享测试契约 |

### 3.2 直接复用（不重写）的外部依赖 —— 重要发现

分析发现 Ant Design 生态里有 **5 个框架无关的纯数据/纯算法包**，直接复用是达成一致性的最省成本路径：

| 包 | 版本 | peer 要求 | 用途 |
|---|---|---|---|
| `@ant-design/icons-svg` | 4.6.0 | **无** | 800+ 图标的原始 SVG 数据 |
| `@ant-design/colors` | 8.0.1 | **无** | 预设色板生成算法 |
| `@ant-design/fast-color` | 3.0.1 | **无** | 颜色解析与转换 |
| `dayjs` | 1.11.23 | **无** | 日期处理（DatePicker 系必需） |
| `scroll-into-view-if-needed` | 3.1.0 | **无** | 滚动到可视区 |

**它们不含任何 React 代码**，复用不违反 H1/H5/H6。
`@apollo-design/icons` 的做法是：以 `@ant-design/icons-svg` 为**数据源**，生成 Vue 函数组件 → 获得图标级像素一致性。

### 3.3 明确不复用

| 包 | 替代 | 理由 |
|---|---|---|
| `@ant-design/cssinjs` / `-utils` | 静态 CSS + CSS 变量 | React 耦合（依赖 `useInsertionEffect` 等） |
| `@ant-design/react-slick` | 自研 Carousel（备选 `embla-carousel`） | React 组件移植 |
| `clsx` | Vue 内置 `:class` 对象/数组语法 | Vue 原生已覆盖 |
| `@babel/runtime` | Vite/esbuild 构建期 target 降级 | 构建期问题，非运行时能力 |
| `@rc-component/context` | Vue 原生 `provide`/`inject` | 它存在的唯一理由是解决 React context 全量重渲染；Vue 细粒度响应式下该问题不存在 |

---

## 四、Theme / Token 设计

### 4.1 antd 的 Token 层级（实测规模）

| 层级 | 数量 | 说明 |
|---|---|---|
| **Seed Token** | **34** | 用户/品牌输入，最少最稳定 |
| **Map Token** | **140** | 算法派生。构成：颜色 76 + 字体 17 + 高度 3 + 尺寸 9 + 样式 5 |
| **Alias Token** | **82（自身声明）/ 222（有效字段）** | 有效字段包含全部 Map Token（`AliasToken extends MapToken`），这是 `theme.token` 实际可覆盖的量 |
| **Component Token** | **70 组 / 517 个** | 分布在 55 个组件 |

```
Seed (34)
  │  defaultAlgorithm / darkAlgorithm / compactAlgorithm
  ▼
Map (140)  ← 梯度化：colorPrimary → colorPrimaryHover/Active/Bg/Border...
  │  + alias 组装
  ▼
Alias (82 own / 222 effective)
  │  + component token 覆盖
  ▼
Component (70 组 / 517 个)
```

### 4.2 关键决策：Token → CSS 变量（而非运行时 CSS-in-JS）

**这是本项目最重要的架构决策。**

```
Seed ──algorithm──► Map ──alias──► Alias ──merge──► Component Token
                                                          │
                                      注入 :root / [data-apollo-theme="dark"]
                                      --apollo-color-primary: #1677ff;
                                      --apollo-border-radius: 6px;
                                      --apollo-button-font-weight: 400;
                                                          │
                                      静态 CSS 引用变量
                                      .apollo-btn { background: var(--apollo-color-primary); }
```

**五条理由**：

1. **无运行时样式计算** —— 不产生 hash 类名，不依赖 React 专属的 `useInsertionEffect`
2. **SSR 天然友好** —— 服务端只需输出一段 `:root{...}`，无需样式收集与 hydration 对齐
3. **主题切换零成本** —— 切换 `data-apollo-theme` 属性即可，无需重算全部组件样式
4. **与 antd v6 演进方向一致** —— antd 6.0 新增 `theme.zeroRuntime`；我们直接把该模式作为**默认且唯一**模式
5. **可静态抽取** —— 默认主题可在构建期固化为 `.css`，运行时仅在用户自定义 Token 时才注入变量

**对齐点**：CSS 变量前缀默认 `--apollo-`（对应 antd 的 `cssVar.prefix` 默认 `ant`），且**变量名与 antd 的 cssVar 命名保持同构**，便于对照排查视觉差异。

### 4.3 `packages/theme/` 结构

```
packages/theme/src/
├── interface/
│   ├── seeds.ts          SeedToken（34）
│   ├── maps/             MapToken（颜色/字体/高度/尺寸/样式）
│   ├── alias.ts          AliasToken（82 own）
│   ├── components.ts     ComponentTokenMap（70 组）
│   └── presetColors.ts   预设色（13 色 × 10 阶）
├── themes/
│   ├── default/          defaultAlgorithm
│   ├── dark/             darkAlgorithm
│   ├── compact/          compactAlgorithm
│   └── shared/           genColorMapToken / genSizeMapToken / genFontMapToken / genRadius / genControlHeight
├── util/
│   ├── alias.ts          Seed+Map → Alias 组装
│   ├── genPresetColor.ts
│   └── getAlphaColor.ts
├── runtime/
│   ├── useToken.ts       组件侧读取 Token 的 composable
│   ├── context.ts        ThemeContext / ConfigContext
│   ├── cssVar.ts         Token → CSS 变量名映射与注入
│   └── registry.ts       Component Token 默认值注册表
├── getDesignToken.ts     无 DOM 环境下的纯计算（对齐 antd 同名 API）
└── index.ts
```

### 4.4 主题能力清单

| 能力 | 实现 |
|---|---|
| default theme | `defaultAlgorithm` |
| dark theme | `darkAlgorithm`，`theme.algorithm` 或 `data-apollo-theme="dark"` |
| compact theme | `compactAlgorithm`，可与 dark 组合（algorithm 数组） |
| 嵌套主题 | 嵌套 ConfigProvider + `inherit: false` 时在子树容器重新注入变量作用域 |
| component token override | `theme.components.Button = { fontWeight: 600 }` |
| runtime customization | 改 `theme.token` → 重算变量写入作用域 |
| 零 DOM 计算 | `getDesignToken(config)` 纯函数，供 SSR / 设计工具 / 文档站点使用 |

---

## 五、React → Vue API Compatibility 设计

完整规则见 [`COMPATIBILITY.md`](../COMPATIBILITY.md)。核心要点：

### 5.1 兼容性的五个可度量层级

| 层 | 内容 | 要求 |
|---|---|---|
| **L1 API Shape** | 组件名 / Props 名 / 事件名 / Slots / 方法名 | **必须完全对齐** |
| **L2 Behavior** | 交互行为 / 状态流转 / 受控非受控 / 边界 | **必须完全对齐** |
| **L3 DOM Contract** | 类名 / DOM 层级 / `data-*` / `role` | 结构同构，平台差异需登记 |
| **L4 Visual** | 尺寸 / 颜色 / 间距 / 圆角 / 阴影 / 动效 | 像素级比对，差异需分类 |
| **L5 Accessibility** | `role` / `aria-*` / 键盘 / 焦点 | **不得低于 antd** |

### 5.2 核心映射规则（节选）

| React | Vue | 规则 |
|---|---|---|
| `children` | 默认插槽 | C1 |
| `className` / `style` | `class` / `style`（经 `$attrs` 透传） | C6 |
| `onClick` / `onChange` | `@click` / `@change`（emit 名去 `on` 首字母小写） | C5 |
| 原生 DOM 事件 | 经 `$attrs` 透传，**不通过 emit 声明** | C6 |
| `value` + `onChange` | **`v-model:value`**（v-model 参数名沿用 React 的受控 prop 名） | C10 |
| `checked` / `open` / `activeKey` / `current` / `selectedKeys` / `expandedKeys` | `v-model:checked` / `:open` / `:activeKey` / ... | C10 |
| `defaultValue` | `defaultValue`（**不改为** `initialValue`） | C10 |
| `renderItem` / `renderCell` / `renderOption` | 作用域插槽 `#item` / `#cell` / `#option`，**同时兼容**函数 prop（prop 优先） | C8 |
| `forwardRef` + `ref.current.focus()` | `defineExpose` + `compRef.value?.focus()` | C12 |
| `message.success()` / `Modal.confirm()` | 同名静态导出 + `useMessage()` / `useModal()` composable | C13 |
| `App.useApp()` | `useApp()` | C13 |
| `React.ReactNode` | `ApolloNode`（本项目定义） | C17 |
| `React.CSSProperties` | `CSSProperties`（from `vue`） | C17 |
| `useState` / `useEffect` / `useMemo` | `ref` / `onMounted`+`watch` / `computed` | C15 |
| `useCallback` | **无对应物**（Vue 无引用稳定性问题） | C15 |
| `React.memo` | **不需要**（Vue 细粒度响应式） | C15 |

**命名原则**：
- **Props 名与 antd 完全一致**，不做任何重命名（`type` 不改成 `variant`，`size` 保留 `middle` 不改 `medium`）
- 组件全局注册加 `A` 前缀（`<a-button>`），同时支持按需导入（`<Button />`）
- 事件 payload 参数顺序与 React 完全一致
- 类型名与 antd 一致（`ButtonProps` / `SelectProps` / `TableColumnsType`）

**已登记的 7 项有意差异**（D1-D7，见 `COMPATIBILITY.md` §9）：
`visible`→`open`、事件模型、`children`→插槽、`useCallback` 缺失、CSS-in-JS→CSS 变量、`prefixCls` 默认值、`zeroRuntime` 恒为 true。

### 5.3 禁止事项

- 禁止从 `antd` / `@rc-component/*` 导入类型（必须重新定义）
- 禁止创建 `useEffect` / `useState` / `useMemo` 的模拟层
- 禁止为了"看起来像 React"而引入多余的包装 `<div>`（会破坏 DOM Contract）

---

## 六、rc-* 依赖替代方案

完整决策表见 [`registry/dependencies.json`](../registry/dependencies.json)（54 项）与 [`registry/source/rc-map.mjs`](../registry/source/rc-map.mjs)。

### 6.1 四种策略的分布

| 策略 | 数量 | 含义 |
|---|---|---|
| `reuse` 直接复用 | 5 | 框架无关的纯数据/纯算法包 |
| `apollo` 独立包承接 | 13 | ≥2 消费者且无视觉语义 |
| `in-ui` ui 内部承接 | 31 | 单一消费者，独立成包属过度抽象 |
| `drop` 不需要 | 5 | Vue 原生已覆盖，或仅服务 React |

### 6.2 37 个 `@rc-component/*` 的逐项判定

**升级为 `@apollo-design/*` 包（10 个）**

| rc 包 | 被多少组件用 | 归属 |
|---|---|---|
| `@rc-component/util` | **61** | `@apollo-design/utils` |
| `@rc-component/motion` | 12 | `@apollo-design/motion` |
| `@rc-component/resize-observer` | 5 | `@apollo-design/utils`（并入） |
| `@rc-component/trigger` | 3 | `@apollo-design/trigger` |
| `@rc-component/tooltip` | 2 | `@apollo-design/trigger`（定位部分） |
| `@rc-component/form` | 1 | `@apollo-design/form-core` |
| `@rc-component/picker` | 3 | `@apollo-design/picker` |
| `@rc-component/mutate-observer` | 1 | `@apollo-design/utils`（并入） |

**传递依赖中被我们主动升级为独立包（3 个）**

| 包 | 归属 | 理由 |
|---|---|---|
| `@rc-component/virtual-list` | `@apollo-design/virtual-list` | 被 Select/Tree/Table/Cascader/TreeSelect 传递依赖 |
| `@rc-component/async-validator` | `@apollo-design/form-core`（内置） | antd Form rules 语义与它强绑定，必须实现同语义校验器 |
| `@rc-component/portal` | `@apollo-design/portal` | Vue 的 Teleport 解决了"渲染到别处"，但容器复用、SSR 安全延迟挂载、z-index 层级、堆叠顺序都需自己实现 |
| `@rc-component/overflow` | `@apollo-design/utils`（检测部分） | 被 float-button / segmented 使用 |

**留在 `packages/ui` 内部（27 个）**

`select`、`table`、`tree`、`menu`、`tabs`、`steps`、`collapse`、`cascader`、`tree-select`、`checkbox`、`input`、`input-number`、`slider`、`switch`、`rate`、`segmented`、`pagination`、`upload`、`mentions`、`dropdown`、`dialog`、`drawer`、`notification`、`image`、`color-picker`、`progress`、`listy`、`tour`

**直接丢弃（1 个）**：`@rc-component/context` → Vue 原生 `provide`/`inject`

### 6.3 需要注意的实现细节（不能简化）

| 能力 | 所在组件 | 为什么不能简化 |
|---|---|---|
| **输入法组合态（IME）** | Input / Mentions | 中文/日文输入时 `compositionstart/end` 与受控值同步的正确处理 |
| **焦点陷阱 + 焦点归还 + Esc** | Modal / Drawer | a11y 硬要求（L5 不得低于 antd） |
| **滚动锁定** | Modal / Drawer | 打开时锁定 body 滚动且不产生布局跳动 |
| **XHR 上传与 abort** | Upload | `beforeUpload` / `customRequest` / `onProgress` / 取消语义 |
| **motionDeadline / motionLeaveImmediately** | 全部动效组件 | Vue 内置 `<Transition>` 无法表达 |
| **异步校验的竞态处理** | Form | 连续输入时旧校验结果不得覆盖新结果 |

### 6.4 二维码与轮播的选型待定（诚实标注）

| 组件 | 候选 | 状态 |
|---|---|---|
| QRCode | `qrcode` / `qr-code-styling` 等框架无关库 | ⚠️ **需在开发 QRCode 组件时实测确认** |
| Carousel | 自研 / `embla-carousel` | ⚠️ **需在开发 Carousel 时评估自研成本** |

`@rc-component/qrcode` 与 `@ant-design/react-slick` 都绑定 React，不可用。

---

## 七、组件完整清单

**72 个组件**，完整数据见 [`registry/components.json`](../registry/components.json)。

### 7.1 按 antd 文档分组

| 分组 | 数量 | 组件 |
|---|---|---|
| 通用 | 3 | button, typography, border-beam |
| 布局 | 6 | divider, flex, grid, layout, space, splitter |
| 导航 | 8 | affix, anchor, back-top, breadcrumb, dropdown, menu, pagination, steps |
| 数据录入 | 18 | auto-complete, cascader, checkbox, color-picker, date-picker, form, input, input-number, mentions, radio, rate, select, slider, switch, time-picker, transfer, tree-select, upload |
| 数据展示 | 22 | avatar, badge, calendar, card, carousel, collapse, descriptions, empty, image, list, listy, masonry, popover, qr-code, statistic, table, tabs, tag, timeline, tooltip, tree, watermark |
| 反馈 | 10 | alert, drawer, message, modal, notification, popconfirm, progress, result, skeleton, spin |
| 其他 | 5 | app, config-provider, float-button, segmented, tour |

### 7.2 按优先级

| 优先级 | 数量 | 组件 |
|---|---|---|
| **P0** 地基与首个垂直切片 | 8 | empty, config-provider, button, space, flex, grid, divider, typography |
| **P1** 简单展示 | 12 | layout, tag, badge, alert, skeleton, spin, result, watermark, border-beam, statistic, affix, back-top |
| **P2** 无浮层的表单/展示控件 | 12 | checkbox, radio, switch, input, input-number, listy, qr-code, upload, splitter, carousel, collapse, descriptions |
| **P3** 浮层基础设施首个消费者 | 10 | tooltip, popover, menu, dropdown, modal, drawer, message, notification, app, image |
| **P4** 浮层之上的交互控件 | 14 | select, auto-complete, cascader, tree, tree-select, popconfirm, tour, float-button, form, slider, rate, segmented, steps, progress |
| **P5** 数据密集型与复杂引擎 | 16 | pagination, breadcrumb, tabs, card, timeline, masonry, anchor, list, table, transfer, mentions, color-picker, date-picker, time-picker, calendar, avatar |

### 7.3 v6 新增组件（无 v5 参考，需额外注意）

| 组件 | 说明 |
|---|---|
| `border-beam` | 边框光束效果 |
| `masonry` | 瀑布流布局 |
| `listy` | 轻量列表 |

---

## 八、组件 Dependency DAG

### 8.1 分析方法（关键：三次精化）

从 antd 产物提取依赖时，必须区分三类边，否则会得到**错误的图**：

| 边类型 | 含义 | 是否阻塞实现 |
|---|---|---|
| **runtime** | 运行时真的 `import` 了该组件 | ✅ 阻塞（构成 `blockedBy`） |
| **type-only** | 仅 `import type` 引用 | ❌ 不阻塞 |
| **leaf** | 导入的是**叶子模块**（如 `../table/TableMeasureRowContext`、`../form/validateMessagesContext`、`../color-picker/util`） | ❌ 不阻塞 |

**为什么这一步至关重要**：antd 自身存在多个**假环**：

- `message` ← `app` ← `message`/`notification`（实际是互相引用 `app/context` 与 `message/useMessage` 叶子模块）
- `config-provider` ← `form`/`tooltip` ← `config-provider`（实际是引用 `form/validateMessagesContext`、`tooltip/UniqueProvider` 叶子模块）
- `tooltip` ← `table`/`color-picker`（实际是引用 `table/TableMeasureRowContext`、`color-picker/util`）
- `select` ↔ `cascader`/`tree-select`/`mentions`/`auto-complete`（互相引用对方的 hooks/style 叶子模块）

若不区分，会得到 4 组环，DAG 无法用于任务排序。
区分后：**82 条运行时边，0 环**。

### 8.2 DAG 分层（按最长路径）

| 层 | 组件 |
|---|---|
| **L0** | empty, divider, typography, spin, result, border-beam, alert, watermark, affix, back-top |
| **L1** | config-provider, space, flex, grid, tag, badge, layout, switch, input-number, checkbox, select, tree, tree-select, cascader, date-picker, upload, carousel, collapse, splitter, listy, skeleton, message, notification, image, tour |
| **L2** | button, tooltip, popover(→L3), menu(→L3), modal, drawer, radio, descriptions, statistic, … |
| **L3** | popover, menu, input, auto-complete, float-button, form, slider, rate, segmented, steps, progress, pagination, card, calendar |
| **L4** | dropdown, popconfirm, timeline, list, table, color-picker, avatar |
| **L5** | transfer |

完整分层与逐节点依赖见 `dependencies.json` 的 `componentDag`，或运行：

```bash
node registry/tools/gen-registry.mjs --print-dag
```

### 8.3 高影响节点（`unblocks` 传递闭包计数）

| 组件 | 解锁下游 |
|---|---|
| `empty` | **51** |
| `config-provider` | **50** |
| `space` / `skeleton` / `spin` | 4 |
| `popover` / `pagination` | 3 |
| `button` / `menu` / `tooltip` | 2 |

**这就是为什么 P0 是 `empty` + `config-provider` + `button`。**

### 8.4 循环依赖的架构对策（已写入 `dependencies.json`）

| 环 | antd 的成因 | 我们的解决方式 |
|---|---|---|
| app ↔ message ↔ notification | 三方互相引用 context / hooks | 把 `AppContext` 提取为 `ui/src/_internal/app-context.ts` 纯 context 叶子模块 |
| config-provider ↔ form ↔ tooltip | 引用对方的 context / UniqueProvider | 把 `ConfigContext`/`DisabledContext`/`SizeContext`/`ValidateMessagesContext`/`UniqueContext` 全部提取为 `ui/src/_internal/context/*.ts` |
| tooltip ↔ table ↔ color-picker | 引用 `TableMeasureRowContext` / `color-picker/util` | context 移入 `_internal/context/`，颜色工具移入 `utils` |
| select ↔ cascader/tree-select/mentions/auto-complete | 互相引用 hooks / style / 常量 | 把 Select 的下拉基础能力提取为 `ui/src/select/_shared/` 叶子模块 |

**这是一条硬性架构规则**：共享 context 与工具必须放在**叶子模块**，组件之间不得互相 import 组件目录。

---

## 九、组件开发优先级

优先级不只是"哪个重要"，而是**必须满足 DAG 拓扑序**：组件的优先级不得早于其任一阻塞性依赖（由 `validate-registry.mjs` 的 E5 强制检查）。

```
P0  empty → config-provider → button → space / flex / grid / divider / typography
     │
     ▼
P1  简单展示层（无浮层、无引擎）—— 用来把 7 层测试流水线跑顺
     │
     ▼
P2  无浮层的表单/展示控件
     │
     ▼
P3  ★ tooltip（验证 AR1 定位）+ modal（验证 AR2 动效）—— 架构风险验证点
     │
     ▼
P4  浮层之上的交互控件（select 验证 virtual-list；form 验证 form-core）
     │
     ▼
P5  数据密集型（table / date-picker / transfer 等 XL 组件）
```

**同优先级内的排序规则**（`next-task.mjs` 自动执行）：
`unblocks 降序` → `complexity 升序` → `dagLevel 升序`

### 里程碑

| 里程碑 | 内容 | 判据 |
|---|---|---|
| **M0** Foundation 就绪 | 7 个包的最小可用集 + 测试基础设施 | AR1/AR2 PoC 通过；三算法产出 CSS 变量 |
| **M1** 首个垂直切片 | `empty` → `config-provider` → `button` | Button 走完 G0-G14 全部 14 道 Gate |
| **M2** 流水线可规模化 | P0 + P1 共 20 个组件 | 无新增架构级阻塞 |
| **M3** 基础设施全部验证 | P3 + P4 共 24 个组件 | AR1-AR4 全部关闭 |
| **M4** 全量完成 | 72 个组件 | 全量视觉回归与 compat 比对通过 |

---

## 十、测试架构

完整设计见 [`TESTING.md`](../TESTING.md)。

### 10.1 七层测试

| 层 | 运行入口 | 环境 | 验证什么 |
|---|---|---|---|
| L1 Unit | `pnpm test:unit` | jsdom | 纯逻辑、Token 计算、状态机转移 |
| L2 Interaction | `pnpm test:unit` | jsdom | 真实用户交互（鼠标/键盘/焦点/拖拽） |
| L3 Type | `pnpm test:types` | vue-tsc | Props/Emits/Slots/Expose 类型与泛型推导 |
| L4 DOM Contract | `pnpm test:dom` | jsdom | 类名结构、DOM 层级、`data-*` |
| L5 A11y | `pnpm test:a11y` | jsdom + axe | `role`/`aria-*`/键盘可达/焦点管理 |
| L6 Visual | `pnpm test:visual` | Playwright | 像素级，对比 React 参考实现 |
| L7 Build | `pnpm test:build` | node | 产物、exports、**无 React 依赖**、体积预算 |

### 10.2 共享测试契约（`@apollo-design/test-utils`）

| 模块 | 作用 |
|---|---|
| `mountTest` | 渲染 → 更新 → 卸载不报错 |
| `demoTest` | 遍历全部 demo，无报错无 warning |
| `a11yDemoTest` | 遍历全部 demo 跑 axe，要求 0 violation |
| `focusTest` | 焦点获取/丢失/归还 |
| `rtlTest` | 镜像布局 |
| `rootPropsTest` | `rootClassName`/`rootStyle`/`prefixCls` 契约 |
| `domContractTest` | **新增**：与 React 基线比对结构化 DOM 契约 |
| `themeTest` | **新增**：light/dark/compact/token-override 四态渲染 |
| `resetWarned` / `waitFrames` | 确定性辅助 |

### 10.3 Button 的完整测试矩阵（作为所有组件的覆盖基准）

`type`(5) × `size`(3) × `loading` / `disabled` / `danger` / `block` / `ghost` / `icon`(3 种传入方式) / `htmlType`(3) / `click` / `keyboard`(Enter, Space, Tab) / `focus` / `hover` / `active` / `wave`(含卸载不泄漏) / `theme` / `dark` / `compact` / `token override` / `classNames`+`styles` 优先级 / `ref` 暴露 / `ButtonGroup`(尺寸继承、compact 合并边框)

**其他组件按此模式把每个 prop × 每个状态 × 每个主题展开成矩阵，写进组件的分析文档。**

### 10.4 反模式清单（10 条，明确禁止）

只断言 `exists()` / 直接调内部方法 / `await sleep()` / 改预期让红灯变绿 / 无理由 skip / 批量加白名单 / 用完整 DOM 快照替代契约测试 / 只测 happy path / 组件测试中 import `antd` / 用 `any` 绕过类型测试

---

## 十一、Visual Regression 方案

### 11.1 对比机制

```
React 参考（antd 6.6.4）          Vue 实现（@apollo-design/ui）
  渲染同一 fixture                    渲染同一 fixture
        │ Playwright 截图                   │
        ▼                                   ▼
  react/<id>.png                      vue/<id>.png
        └──────────────┬────────────────────┘
                       ▼
        sharp 归一化尺寸 → pixelmatch 逐像素比对
                       ▼
              差异率 + diff 图 + HTML 报告
```

### 11.2 截图矩阵

| 类别 | 状态 |
|---|---|
| **必选** | default / hover / active / focus / disabled / loading / dark / compact |
| 按组件追加 | open / selected / checked / error / warning / success / expanded / dragging / empty / readonly |
| viewport | 375×667（mobile）/ 768×1024（tablet）/ 1440×900（desktop） |

### 11.3 稳定性要求（必须全部满足）

禁用动画（注入 `prefers-reduced-motion` + 关闭 motion 开关）、固定字体（打包测试字体）、固定 viewport/DPR/时区/locale、隐藏 caret、固定随机 ID 与时间戳、截图前 `waitForFonts()` + 等一帧。

### 11.4 阈值策略

| 差异率 | 判定 |
|---|---|
| 0% | ✅ 通过 |
| ≤ 0.1% 且为抗锯齿噪声（分散单像素） | ✅ 自动通过 |
| > 0.1% 或成块差异 | ❌ 必须人工确认并分类 |

**禁止**为提高阈值让测试通过（T17）。

---

## 十二、React / Vue Compatibility Fixture 方案

完整设计见 [`tests/compat/README.md`](../tests/compat/README.md)，格式定义见 [`tests/compat/schema.json`](../tests/compat/schema.json)。

### 12.1 核心思想

**fixture 是唯一事实来源。** 一份 JSON 同时驱动两个实现，两侧都不允许在 fixture 之外偷偷加断言或加例外。

```json
{
  "id": "button/loading",
  "component": "button",
  "description": "loading 状态：验证 loading 图标出现、交互被阻止、click 不触发。",
  "antdVersion": "6.6.4",
  "props": { "type": "primary", "loading": true },
  "content": "Loading",
  "interactions": [{ "type": "hover" }, { "type": "click" }],
  "assertions": { "api": true, "dom": true, "aria": true, "behavior": true, "screenshot": true },
  "expect": { "events": [] }
}
```

### 12.2 五个比对层

| 层 | 比对内容 |
|---|---|
| L1 `api` | props 最终落到 DOM 上的效果 |
| L2 `behavior` | 事件序列与参数摘要 |
| L3 `dom` | 结构化 DOM 契约（标签 + 类名 + `data-*` + `role`/`aria-*`） |
| L4 `screenshot` | 像素截图 |
| L5 `aria` | `role` 与全部 `aria-*` |

### 12.3 三个关键设计

1. **语义化交互指令**（`hover` / `keyboard{key}` / `click{target}`）而非具体 API —— 避免 fixture 偏向某一侧实现
2. **DOM 归一化必须对称** —— 类名去 `prefixCls` 前缀、移除 hash 类名、忽略 `style` 具体值、忽略随机 ID。**只作用于单侧的归一化都是作弊**
3. **白名单必须带理由与差异编号** —— `allow` 需同时提供 `reason` 与 `deviationId`（指向 `COMPATIBILITY.md` §9），否则 CI 失败

### 12.4 React 隔离

React 与 antd **只允许出现在 `tests/compat/runner/drivers/react.mjs`**。它们是 devDependencies，绝不允许进入 `packages/**` 的依赖。`validate-registry.mjs` 的 E11 检查会扫描全部构建产物，发现 `react` / `@rc-component` / `@ant-design/cssinjs` 即失败。

### 12.5 当前状态

Phase 1 交付**机制与格式**（schema + 3 个示例 fixture + 归一化规则设计 + 目录结构）。
runner 的实现随 Button 的 G10 Gate 一起完成 —— **在此之前 Button 的 `visualStatus` 不能置为 `done`**。

---

## 十三、文档体系

### 13.1 项目级文档（已交付）

| 文件 | 职责 |
|---|---|
| `AGENTS.md` | Agent 行为契约、12 条硬禁止、唯一合法开发循环、验收纪律、事实来源优先级 |
| `ARCHITECTURE.md` | 包结构、分层规则、Theme Runtime、样式架构、6 项已知架构风险 |
| `COMPONENT-RULES.md` | 组件目录结构、`.vue`/`.tsx` 选择、骨架规范、Props/Token/DOM/a11y 规范、13 项自检清单 |
| `COMPATIBILITY.md` | 5 层兼容性定义、命名规则、children/render/受控/hooks/类型映射、7 项已登记差异、4 组迁移示例 |
| `WORKFLOW.md` | G0-G14 十四道 Gate、每道 Gate 的通过标准、「继续推进」协议、阻塞处理 |
| `TESTING.md` | 7 层测试、共享契约、Button 测试矩阵、反模式清单 |
| `registry/README.md` | Registry 使用方式、状态机、校验项清单 |
| `tests/compat/README.md` | 兼容性机制、归一化规则、命令、报告格式 |

### 13.2 组件文档结构（每个组件两份：zh-CN / en-US）

```
何时使用（自写，不复制 antd 文案）
代码演示（引用 demo/，每个 demo 必须可运行且被 demoTest 覆盖）
API
├── Props     | 属性 | 说明 | 类型 | 默认值 | 版本 |
├── Events    | 事件 | 说明 | 参数 |
├── Slots     | 插槽 | 说明 | 参数 |        ← children 从 Props 移到这里
├── Methods   | 方法 | 说明 | 参数 | 返回值 |
└── Design Token | Token | 说明 | 类型 | 默认值 |   ← 来自 registry/tokens.json
FAQ
```

**规则 R19**：文档必须重新撰写（H2）。允许对齐的是 API 表结构、Prop 名、类型、默认值。
**规则 R20**：文档 API 表从类型定义自动生成，避免手写漂移。

### 13.3 分析与决策记录

| 目录 | 用途 |
|---|---|
| `docs/analysis/<component>.md` | 每个组件的分析产物（G1 的交付物），模板见 `docs/templates/` |
| `docs/adr/NNNN-*.md` | 架构决策记录（ADR），已建 3 篇 |
| `docs/PHASE-1-REPORT.md` | 本报告 |

---

## 十四、Agent 长期工作流

### 14.1 「继续推进」协议

当用户只说「继续推进」时，Agent 执行：

```
1. node registry/tools/next-task.mjs          ← 唯一权威的任务来源
2. 执行 WORKFLOW.md 的 G0 → G14（一个组件，一轮）
3. 汇报（结构固定）：
   - 本次完成：<组件> + 一句话结论
   - 通过的 Gate：G0-G14（含关键命令的真实输出摘要）
   - 视觉回归：差异率 + 是否需要人工确认
   - 差异登记：新增了哪些差异
   - 阻塞/风险：需要用户裁决的事项
   - 下一步建议：next-task.mjs 给出的下一个候选
4. 停止，等待下一轮
```

**硬性约束**：
- 一轮只做一个组件，不允许"顺手"把下一个也做了
- 不允许重复已完成组件
- 不允许降低任何 Gate 标准
- 遇到 G9/G10 的差异裁决分叉，**停下来问用户**

### 14.2 任务选择算法（不可手动绕过）

```
过滤 completed
  → 过滤 blockedBy 非空
  → priority 升序（P0→P5）
  → unblocks 降序
  → complexity 升序
  → dagLevel 升序
```

### 14.3 防止退化的机制

| 风险 | 机制 |
|---|---|
| 降低验收标准 | G0-G14 十四道 Gate + `validate-registry.mjs` 的 E3 强制检查（completed 必须 7 维度全 done） |
| 改测试预期让红灯变绿 | `AGENTS.md` H7 + `TESTING.md` 反模式 A4 + 修测试需在 commit message 说明理由 |
| 批量加白名单通过视觉验收 | `TESTING.md` T17 + fixture 的 `allow` 必须带 `reason` + `deviationId` |
| 引入 React | `validate-registry.mjs` E11 扫描全部构建产物 |
| 硬编码视觉值 | `validate-registry.mjs` E10 静态扫描 |
| 优先级乱序导致"依赖没做" | `validate-registry.mjs` E5 强制 DAG 拓扑序 |
| 进度被生成器抹掉 | `gen-registry.mjs` 保留状态字段 |
| 凭记忆描述 antd 行为 | `AGENTS.md` §5.1 + 可重跑的 `extract-antd-facts.mjs` |

---

## 十五、第一阶段实施计划

### 15.1 Phase 1 已完成的退出条件

| 项 | 状态 |
|---|---|
| 项目侦察（antd 版本/结构/依赖/Token/测试/文档） | ✅ |
| 5 个规范文件 + TESTING.md | ✅ |
| Registry 三文件 + schema | ✅ |
| 依赖 DAG（82 条运行时边，0 环） | ✅ |
| rc-* 替代方案（54 项决策） | ✅ |
| 测试架构（7 层 + 共享契约 + 反模式） | ✅ |
| 兼容性 fixture 机制与格式 | ✅ |
| Registry 工具链（4 个脚本，全部可运行） | ✅ |
| monorepo 骨架 | ✅ |
| 组件实现 | ⬜ **按用户要求未开始** |

### 15.2 Phase 2 实施计划

| 步骤 | 内容 | 退出条件 |
|---|---|---|
| **S1** | 完成 `@apollo-design/utils` 最小可用集 | 单测覆盖 ≥95% |
| **S2** | 完成 `@apollo-design/theme`（三算法 + cssVar 注入 + `getDesignToken`） | Token 计算单测 100% 覆盖；产出 `base.css` |
| **S3** | 完成 `@apollo-design/icons` 构建管线 | 生成 P0/P1 所需图标；单测通过 |
| **S4** | 完成 `@apollo-design/test-utils` 全部共享契约 | 7 层测试各有可运行示例 |
| **S5** | **AR1 PoC**：`trigger` 定位最小实现 | 与 antd 参考截图比对，`topLeft/center/bottom*` + 翻转 + 箭头差异 ≤ 阈值 |
| **S6** | **AR2 PoC**：`motion` 的 CSSMotion 等价物 | collapse/slide/zoom/fade/move 五类语义与 antd 一致 |
| **S7** | `@apollo-design/portal` | 容器管理 + z-index 层级 + SSR 安全 |
| **S8** | **M1 首个垂直切片**：`empty` → `config-provider` → `button` | Button 走完 G0-G14；compat runner 最小可用版本落地 |
| **S9** | 按 `next-task.mjs` 顺序推进 P1 → P5 | 每轮一个组件 |

**S5 与 S6 是架构风险验证点，必须先做 PoC 再大规模推进。** 如果 PoC 失败，架构需要调整（例如 trigger 改为依赖第三方定位库），这会改变后续所有浮层组件的实现路径。

---

## 十六、第一批需要实现的基础设施

按依赖顺序：

| 顺序 | 包 / 能力 | 关键交付 |
|---|---|---|
| 1 | `@apollo-design/utils` | `is*` 类型判断、`warning` 体系、DOM 操作、`raf`、`scroll`/`getScrollBarSize`、ref 合并、`pickAttrs`、ResizeObserver/MutationObserver 封装、`throttle-debounce` |
| 2 | `@apollo-design/theme` | Seed(34) → Map(140) → Alias(82) → Component(70 组) 派生链；default/dark/compact 算法；`cssVar.ts` 注入；`getDesignToken`；`registry.ts` 组件 Token 默认值表 |
| 3 | `@apollo-design/icons` | 以 `@ant-design/icons-svg` 为数据源的 Vue 组件生成管线 |
| 4 | `@apollo-design/test-utils` | 10 个共享测试契约 |
| 5 | **AR1 PoC** `@apollo-design/trigger` | 定位算法最小实现 |
| 6 | **AR2 PoC** `@apollo-design/motion` | CSSMotion 等价物 |
| 7 | `@apollo-design/portal` | Teleport 封装 + 容器管理 + 层级 |
| 8 | 接口契约（不实现） | `virtual-list` / `form-core` / `picker` 的公开接口定义 |
| 9 | 测试基础设施 | Vitest 多 project 配置、Playwright 视觉测试脚手架、compat runner |

---

## 十七、第一个完整 Vertical Slice 的选择与理由

### 结论：**Button**

### 17.1 为什么是 Button

`next-task.mjs` 的实际输出顺序是 `empty` → `config-provider` → `button`。
`empty` 与 `config-provider` 是**前置条件**（config-provider 是 50 个组件的依赖，`empty` 是 config-provider 的依赖）。
**Button 是第一个能走完 14 道 Gate 的完整垂直切片。**

| 判据 | Button 的表现 |
|---|---|
| **覆盖全部机制** | Props（type/size/loading/danger/block/ghost/icon/htmlType）、Events（click）、Slots（default/icon）、Expose（focus/blur/nativeElement）、Token（**43 个 Component Token**）、样式、主题（light/dark/compact）、动效（wave 波纹 + loading 旋转）、disabled 语义、a11y（原生 `<button>`） |
| **规模适中** | antd 构建产物 1258 行 / 22 文件，complexity = **M**。不至于在验证流水线阶段就被复杂度拖死 |
| **无浮层、无引擎** | 不需要 trigger / portal / virtual-list / picker / form-core。可以**先验证流水线本身**，把架构风险（AR1/AR2）留到 P3 单独处理 |
| **依赖面干净** | 只依赖 `config-provider`（+ 叶子模块 `DisabledContext`/`context`/`useSize`/`space/Compact`）+ `theme`/`utils`/`icons`/`motion` |
| **下游价值高** | `unblocks = 2`（dropdown、float-button），且 `space` 的 Compact 语义、`config-provider` 的 size/disabled 语义都会在这里被首次真实使用 |
| **是 antd 自身最成熟的组件** | 测试文件 11 个（`index` / `a11y` / `demo` / `demo-extend` / `semantic` / `demo-semantic` / `wave` / `delay-timer` / `image`），行为规格最完整、最容易对照 |
| **a11y 风险低** | 使用原生 `<button>`，天然键盘可达、有原生 role，不会在 a11y 层引入未知风险 |

### 17.2 为什么不是其他候选

| 候选 | 否决理由 |
|---|---|
| `empty` / `space` / `divider` / `flex` | 太简单（complexity S），走完 14 道 Gate 也无法验证「Props 组合矩阵」「Expose」「动效」「多主题」这些机制，**证明力不足** |
| `config-provider` | 它是基础设施而非组件：没有视觉外观、没有交互、无法做有意义的视觉回归。它是必须的前置项，但不适合当第一个垂直切片 |
| `input` | 需要处理输入法组合态（IME），这是独立的技术难点，会干扰对流水线本身的验证 |
| `tooltip` | 依赖 `trigger`，会把 AR1（定位）风险混进来，导致「流水线是否可用」与「定位是否准确」两个问题互相掩盖 |
| `modal` | 依赖 `portal` + `motion`，同理混入 AR2 风险 |
| `table` | complexity XL，验证成本过高 |
| `typography` | 子组件多（Title/Text/Paragraph/Link）、能力多（ellipsis/copyable/editable），比 Button 更复杂，但机制覆盖并不更广 |

### 17.3 Button 的验收清单（M1 的判据）

Button 必须走完 G0-G14，且：

- [ ] 43 个 Component Token 全部与 antd 同名同默认值
- [ ] Props 名/类型/默认值与 antd 一致（`size` 默认 `middle`）
- [ ] `type`(5) × `size`(3) 矩阵的类名与视觉与 antd 一致
- [ ] `loading` 阻止 click 且不 emit
- [ ] `wave` 波纹效果与 antd 一致，且卸载时不泄漏
- [ ] `defineExpose` 暴露 `nativeElement` / `focus` / `blur`
- [ ] DOM 契约与 antd 结构同构（`data-*` 属性一致）
- [ ] axe 0 violation；Enter/Space 可触发
- [ ] light / dark / compact 三态视觉正确
- [ ] `classNames` / `styles` 优先级正确（ConfigProvider < 组件）
- [ ] `ButtonGroup` 的尺寸继承与 compact 合并边框正确
- [ ] compat fixture 在双实现上比对通过
- [ ] 中英文双份文档完成
- [ ] `registry/components.json` 中 7 个维度全部 `done`

---

## 十八、发现的问题（需要关注或裁决）

### 18.1 需要用户裁决的架构决策

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| **Q1** | `prefixCls` 默认值用 `apollo` 还是 `ant`？ | 影响 DOM Contract 与视觉回归的归一化复杂度 | 建议 `apollo`（品牌隔离）。代价：视觉回归必须做前缀归一化（已设计）。**若希望视觉回归零归一化，可改为 `ant`** |
| **Q2** | 是否接受「零运行时 CSS」作为唯一模式（不提供 CSS-in-JS 路径）？ | 这是本项目最大的架构决策 | 建议接受。理由见 §四。代价：用户无法用 `createStyles` 这类动态样式 API（antd 用户极少使用） |
| **Q3** | `table-core` / `tree-core` 是否要在 Phase 2 就提取为独立包？ | 影响 P5 的实现路径 | 建议**不提取**，等第二个消费者出现。若计划做 ProTable / 可编辑表格，则应提前提取 |
| **Q4** | Carousel 自研还是用 `embla-carousel`？ | 影响一个组件的实现成本与视觉一致性 | 建议开发到 Carousel 时实测评估（`@ant-design/react-slick` 是 React 移植，不可用） |
| **Q5** | 文档站点用什么？ | 影响 §十三 的落地 | 候选：VitePress / 自建（antd 用 dumi）。建议 VitePress，与 Vue 生态一致 |
| **Q6** | 视觉回归的基线截图是否纳入 git？ | 1148 个 demo × 多状态 × 3 viewport × 3 主题，体积可能很大 | 建议：**只对已实现组件**生成基线，存 git-lfs 或 CI artifact，不全量纳入 |

### 18.2 已识别但已有对策的风险

| # | 风险 | 对策 | 验证时机 |
|---|---|---|---|
| AR1 | `trigger` 定位要做到像素级一致，需自研对齐算法（翻转、箭头、滚动容器、`getPopupContainer`） | Phase 2 S5 做 PoC，先于任何浮层组件 | 开发 Tooltip 前 |
| AR2 | `motion` 需覆盖 5 类语义，Vue 内置 `<Transition>` 不足以表达 `motionDeadline`/`motionLeaveImmediately` | Phase 2 S6 做 PoC | 开发 Modal 前 |
| AR3 | `picker` 引擎与 dayjs 的耦合深度、区间选择状态机复杂度 | 先读 `@rc-component/picker` 状态机再评估 | 开发 DatePicker 前 |
| AR4 | 零运行时 CSS 下语义化 `classNames`/`styles` 与 Token 变量的组合优先级 | 已定义优先级规则，需写测试锁定 | 随 config-provider 开发 |
| AR5 | TypeScript 已是 **7.0.2**，但 `unbuild@3.6.1` peer 要求 `typescript ^5.9.2` | **锁定 TS 5.9.x**，把 TS7 升级记为后续任务 | 已处理 |
| AR6 | Vue 泛型组件对 antd 复杂泛型 API（如 `Table<RecordType>`）的表达力 | 用 Table 的泛型签名做类型层 PoC | 开发 Table 前 |
| AR7 | antd v6 有 3 个新组件（`border-beam`/`masonry`/`listy`）没有 v5 参考，网上资料少 | 以 antd 6.6.4 产物与测试为唯一判据 | 开发时 |

### 18.3 依赖选型待确认项

| 项 | 状态 |
|---|---|
| QRCode 的第三方库选型 | ⚠️ 待开发 QRCode 时实测（候选：`qrcode`、`qr-code-styling`） |
| Carousel 自研 vs `embla-carousel` | ⚠️ 待开发 Carousel 时评估 |
| 文档站点框架 | ⚠️ 待用户裁决（Q5） |
| 视觉回归基线的存储方式 | ⚠️ 待用户裁决（Q6） |

### 18.4 一个值得记录的发现

antd 6.6.4 的 `es/` 产物里有 **3 个别名目录**（`qrcode` / `row` / `col`），它们的内容分别是 `qr-code` / `grid` 的再导出。

**如果不识别这一点，组件计数会多出 3 个**（75 → 78），且会在 DAG 里引入 3 个虚假节点。
本项目的提取脚本已显式处理（`ALIAS_DIRS`），并在 `validate-registry.mjs` 的 E12 中校验组件数一致性。

---

## 附：本轮产出的文件清单

```
AGENTS.md                              12 条硬禁止 + 唯一合法开发循环 + 验收纪律
ARCHITECTURE.md                        包结构 + 分层规则 + Theme Runtime + 7 项架构风险
COMPONENT-RULES.md                     组件规范 + 13 项自检清单
COMPATIBILITY.md                       5 层兼容性 + 映射规则 + 7 项已登记差异 + 迁移示例
WORKFLOW.md                            G0-G14 十四道 Gate + 「继续推进」协议
TESTING.md                             7 层测试 + 共享契约 + Button 测试矩阵 + 10 条反模式
README.md                              项目说明与快速开始
pnpm-workspace.yaml                    工作区 + catalog 版本管理
package.json                           根脚本（registry / lint / test 各层入口）
tsconfig.json                          严格模式 + 路径映射
.npmrc                                 hoist=false（让 DAG 可强制）

registry/
├── README.md                          Registry 使用说明
├── schema.json                        三文件 JSON Schema
├── components.json                    ★ 72 组件状态系统
├── dependencies.json                  ★ DAG + 54 项依赖决策 + 4 组环解决
├── tokens.json                        ★ Token 清单（34/140/82/70/517）
├── source/
│   ├── antd-6.6.4.raw.json            从 antd 产物提取的事实（64KB）
│   ├── components.meta.mjs            72 组件的人工决策
│   └── rc-map.mjs                     54 项依赖替代决策表
└── tools/
    ├── extract-antd-facts.mjs         事实提取（可重跑、可审计）
    ├── gen-registry.mjs               Registry 生成（保留进度字段）
    ├── next-task.mjs                  ★ 任务选择（唯一权威）
    └── validate-registry.mjs          13 项规范检查

tests/compat/
├── README.md                          兼容性机制说明
├── schema.json                        fixture JSON Schema
└── fixtures/button/                   3 个示例 fixture

docs/
├── PHASE-1-REPORT.md                  本报告
├── adr/                               3 篇架构决策记录
└── templates/                         组件分析与文档模板

packages/                              11 个包的骨架（package.json + README.md）
```

**Registry 工具链已验证可运行**：

```
$ node registry/tools/validate-registry.mjs
  ✅ E2  72 个组件的状态字段取值全部合法
  ✅ E3  completed 组件的维度一致性通过
  ✅ E4  组件级运行时 DAG 无环（72 节点）
  ✅ E5  全部组件的优先级均不早于其依赖（DAG 拓扑序一致）
  ✅ E6  blockedBy 与依赖完成状态一致
  ✅ E7  运行时依赖边一致（82 条）
  ✅ E8  foundation 包引用全部合法（10 个包）
  ✅ E9  completed 组件均有 compat fixture
  ✅ E10  已实现的组件样式中无硬编码视觉值
  ✅ E12  与 antd v6.6.4 事实一致（72 个组件）
  ⚠️  E11  尚未发现构建产物，跳过 React 痕迹扫描（Phase 2 起生效）
  ⚠️  E13  tests/compat/schema.json 存在
registry validate: OK (10 checks passed, 2 warnings)
```

---

**下一步：等待用户指令。**

按 `AGENTS.md` §3，下一步应由 `node registry/tools/next-task.mjs` 决定，当前输出为 **`empty`**（P0 / S / unblocks=51）。
但按 §十五 的计划，`empty` 之前应先完成 `@apollo-design/utils` 与 `@apollo-design/theme` 的最小可用集 —— 因为它们不在 Registry 的组件清单里，而 `empty` 已经需要它们。

**建议的 Phase 2 起点：S1（`utils`）+ S2（`theme`）**，然后 `empty` → `config-provider` → `button`。
