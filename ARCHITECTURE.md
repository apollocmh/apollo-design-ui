# ARCHITECTURE.md

> 定义 `@apollo-design/*` 的 Monorepo 结构、分层规则、依赖方向、Theme Runtime 与构建契约。
>
> 本文档中的依赖方向是**强制约束**，由 `pnpm run registry:validate`（E1–E18）检查。
> 配套文档：`WORKFLOW.md`（怎么做）、`COMPATIBILITY.md`（与 antd 对齐到什么程度）、
> `COMPONENT-RULES.md`（单个组件怎么写）、`ROADMAP.md`（什么时候做什么）。

---

## 0. 项目定位与不可协商的约束

`@apollo-design/ui` 是 **Ant Design React 6.6.4 的 Vue 3 原生实现**。

三句话定性：

1. **Ant Design React 是兼容性规范，不是代码来源。**
   参考它的 API 形状、交互行为、Design Token、视觉与无障碍语义；**不参考它的实现**。
   不存在 React→Vue 的机械翻译，不引入 React 运行时，不模拟 React 生命周期。

2. **Vue 基线固定 3.5+，用 Vue 原生设计。**
   `v-model` 而不是 `value`+`onChange`；插槽而不是 `render props`；
   `provide/inject` 而不是 Context；`Teleport` 而不是 Portal 组件；
   `Transition` 而不是手写的 class 切换。
   当 Vue 原生方案与 antd 的实现方式不同时，**选 Vue 原生**，并把差异登记到 `COMPATIBILITY.md`。

3. **进度必须机器可读。**
   72 个组件 × 11 个维度、13 个基础设施包 × 6 个维度，全部落在 `registry/*.json`，
   由工具生成 + 校验。任何"我觉得差不多做完了"的判断都不被接受。

---

## 1. 设计起点：Ant Design 6.6.4 的依赖真相

包结构不是拍脑袋定的。以下数字由 `registry/tools/extract-antd-facts.mjs` 从 antd 6.6.4 的真实产物提取（`registry/source/antd-6.6.4.raw.json`）：

| 事实 | 数字 | 含义 |
|---|---|---|
| 运行时依赖 | 48 | 其中 **37 个 `@rc-component/*`** |
| 组件（真实） | **72** | `es/` 目录共 80 个，减去 5 个基础设施目录与 3 个别名（`qrcode`/`row`/`col`） |
| `@rc-component/util` 被引用 | **72 / 72** | 真正的地基，无一例外 |
| Design Token | Seed **34** / Map **140** / Alias **82**（含继承共 222 生效）/ Component **70** 组 **517** 个 | 派生链的规模 |
| 语言包 | **75** | locale 是生成式工作，不是手写工作 |
| demo / 测试 / 快照 | 1148 / 641 / 314 | antd 自己的验收密度 |

**`@rc-component/util` 的 165 条 import 全部走根 barrel，零子路径导入** —— 这决定了
`@apollo-design/utils` 也必须以单一入口导出，且 API 必须逐条对照上游 `.d.ts`
（对照结果见 `docs/foundation/rc-util-contract.md`）。

### 1.1 包边界的唯一判据

> 一个能力只有在 **≥2 个上层组件需要它**，且它**不绑定任何具体组件的视觉语义**时，
> 才升级为 `@apollo-design/xxx` 独立包。
> 否则它作为 `packages/ui/src/<component>/engine/` 内部模块存在，等第二个消费者出现时再提取。

这条判据同时解释了：

- **为什么有** `virtual-list`（Select / Tree / Table / Cascader / TreeSelect 都需要）、
  `form-core`（除 Form 外还被 Calendar / Cascader / Checkbox / Mentions / Pagination / TimePicker /
  Transfer / TreeSelect / Input / InputNumber / Radio / Select / DatePicker 依赖）、
  `picker`（DatePicker / TimePicker / Calendar / RangePicker）。
- **为什么没有** `table-core` / `tree-core` / `select-core` / `menu-core` / `tabs-core` /
  `steps-core`：它们各自只有 1~2 个消费者。**这是有意的决定，不是遗漏。**

---

## 2. Monorepo 结构（13 个包）

```
packages/
│
├── ── L0 地基（零 @apollo-design 依赖）─────────────────────────────
├── utils/          @apollo-design/utils        is/warning/dom/raf/scroll/observer/pickAttrs
├── theme/          @apollo-design/theme        Seed→Map→Alias→Component Token 派生 + CSS 变量
├── icons/          @apollo-design/icons        从 @ant-design/icons-svg 生成（生成物，不手写）
│
├── ── L1 基础设施（只依赖 L0）─────────────────────────────────────
├── motion/         @apollo-design/motion       折叠/滑入/缩放/淡入/位移五类语义   ⚠AR2
├── portal/         @apollo-design/portal       Teleport 封装 + 容器管理 + 滚动锁
├── position/       @apollo-design/position     纯几何：对齐点/翻转/偏移/箭头       ⚠AR1
├── a11y/           @apollo-design/a11y         焦点陷阱/漫游焦点/活动后代/朗读区/首字符导航
├── virtual-list/   @apollo-design/virtual-list 定高/不定高虚拟滚动
│
├── ── L2 领域引擎（依赖 L0 + L1）──────────────────────────────────
├── overlay/        @apollo-design/overlay      触发动作/延迟/关闭行为/层级栈
├── locale/         @apollo-design/locale       75 个语言包（生成物，不手写）
├── form-core/      @apollo-design/form-core    表单状态机 + 校验引擎
├── picker/         @apollo-design/picker       日历网格/区间选择/面板切换
│
├── ── 测试基础设施（private，不发布）──────────────────────────────
├── test-utils/     @apollo-design/test-utils   mountTest/demoTest/a11yDemoTest/domContractTest…
│
└── ── L3 组件库 ───────────────────────────────────────────────────
    ui/             @apollo-design/ui           72 个组件 + ConfigProvider + 全局样式
```

### 2.1 整体架构图

```
                          ┌──────────────────────────────────────────┐
                          │        antd 6.6.4（只读参考：规范）        │
                          │  API 形状 · 行为 · Token · 视觉 · a11y     │
                          └───────────────────┬──────────────────────┘
                                              │ 提取事实（不改代码）
                                              ▼
                                   registry/source/antd-6.6.4.raw.json
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
              components.json        dependencies.json        tokens.json
              (72 组件 × 11 维度)    (13 包 + 依赖 DAG)       (34/140/222/517)
                        │                     │                     │
                        └─────────────────────┼─────────────────────┘
                                              ▼
                                     foundation.json（13 包进度）
                                              │
                                              ▼
                                     workstreams.json（可并行批次）
                                              │
                                              ▼
                                   ┌──────────────────────┐
                                   │  next-task.mjs        │  ← 唯一权威的任务来源
                                   │  --parallel 给批次     │
                                   └──────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        ▼                                     ▼                                     ▼
   L0 地基                              L1 基础设施                          L2 领域引擎
   utils ─┬──────────────┬───────┬────────┬─────────┐                              │
   theme  │              │       │        │         │                              │
   icons  │              │       │        │         │                              │
          ▼              ▼       ▼        ▼         ▼                              │
       motion         portal  position   a11y   virtual-list                       │
                               ⚠AR1                                                │
                          │       │        │                                        │
                          └───────┴────────┴──────► overlay ◄──────────────────────┘
                                                   form-core   picker   locale
                                                       │          │        │
        ┌──────────────────────────────────────────────┴──────────┴────────┘
        ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │  L3  @apollo-design/ui（72 个组件）                                    │
   │  通用 3 · 布局 6 · 导航 8 · 数据录入 18 · 数据展示 22 · 反馈 10 · 其他 5 │
   └─────────────────────────────────────────────────────────────────────┘
```

### 2.2 与早期设想的差异及理由

| 早期设想 | 最终决定 | 理由 |
|---|---|---|
| `overlay` 单包 | **拆为 `position` + `overlay`** | 原设想的一个包同时承担「纯几何」与「生命周期」。前者是纯函数、极易测试；后者与 DOM/生命周期强耦合，是全项目最大风险点 AR1。拆开后 AR1 的 PoC 可以只用纯函数 + 尺寸测量完成，不必先实现触发时机与层级栈。 |
| — | **新增 `a11y`** | L5 无障碍测试层需要落点。`useFocusTrap` / `useRovingFocus` / `useActiveDescendant` / `announce` 被 28 个组件需要，符合 ≥2 消费者判据。 |
| — | **新增 `locale`** | 75 个语言包是生成式产物，从 antd 源生成。与 `icons` 同类，明确"生成物不手写"。 |
| `resize-observer` 独立包 | **并入 `utils`** | 只有 5 个消费者，且 utils 需要的是「单例 observer 复用 / 批监听同一元素」这种与 rc 对齐的语义，VueUse 的 `useResizeObserver` 是「每次调用一个 observer」，语义不匹配。 |
| 建 `@apollo-design/hooks` 包 | **不建，三层共置** | Vue 的 composable 与组件实例强耦合。抽出来要么退化成纯函数（无意义），要么带着 Vue 语义（等于又一个 utils）。见 §6.3。 |
| `table-core` / `tree-core` | **不做** | 单消费者，违反判据。留在 `ui/src/<component>/engine/`。 |

---

## 3. 分层与依赖方向（强制）

| 层 | 成员 | 允许依赖 |
|---|---|---|
| **L0** | `utils` `theme` `icons` | 只允许外部生态依赖（dayjs / fast-color / icons-svg…） |
| **L1** | `motion` `portal` `position` `a11y` `virtual-list` | L0 |
| **L2** | `overlay` `form-core` `picker` `locale` | L0 + L1 |
| **L3** | `ui` | L0 + L1 + L2 + 组件间 DAG 上游 |
| **T** | `test-utils` | 任意（private，不发布） |

### 3.1 依赖规则（R1–R6，违反即 `registry:validate` 失败）

| 规则 | 内容 |
|---|---|
| **R1** | 依赖只能**向下**，不能向上或同层横向。L1 不能依赖 L2，L2 不能依赖 `ui`。 |
| **R2** | L0 之间**互不依赖**。`utils` 不得 import `theme`，反之亦然。 |
| **R3** | L0 不含任何视觉语义：不出现颜色、圆角、间距、字号的**字面值**，不产出任何 CSS。 |
| **R4** | 只有 `ui` 可以产出组件级 CSS。L0/L1/L2 包不发布组件样式（`@apollo-design/theme` 只发布 Token 与 CSS 变量定义）。 |
| **R5** | `ui` 内部组件间依赖必须遵守 `registry/dependencies.json` 的 `componentDag`，且**无环**（E4 检查）。 |
| **R6** | **绝不引入 React 运行时**。`react` / `antd` 只允许出现在根 `devDependencies` 与 `tests/compat/`（参考侧）。产物由 E11 扫描。 |

### 3.2 命名空间与导出

- 包名统一 `@apollo-design/<dir>`；组件导出名统一 PascalCase（`Button`、`DatePicker`）。
- 每个包单一入口（`src/index.ts`）+ 允许深导入。禁止在包内出现跨层相对导入。
- `@apollo-design/ui` 对外同时提供全量入口与按需深导入（构建产物契约见 §8）。

---

## 4. 基础设施依赖关系图

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ L0                                                                      │
  │                                                                        │
  │  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐         │
  │  │    utils     │      │    theme     │      │    icons     │         │
  │  │  72/72 消费   │      │  72/72 消费   │      │  37 个消费者  │         │
  │  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘         │
  └─────────┼─────────────────────┼─────────────────────┼─────────────────┘
            │                     │                     │
            │  ┌──────────────────┴──────────┐          │
            │  │                             │          │
  ┌─────────┼──┼─────────────────────────────┼──────────┼─────────────────┐
  │ L1      ▼  ▼                             ▼          ▼                 │
  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────┐          │
  │  │   motion   │ │   portal   │ │   position   │ │   a11y   │          │
  │  │  20 消费者  │ │  21 消费者  │ │  15 消费者    │ │ 28 消费者 │          │
  │  │   ⚠AR2     │ │            │ │    ⚠AR1      │ │          │          │
  │  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘ └────┬─────┘          │
  │        │              │               │              │                │
  │        │              │        ┌──────┴───────┐      │                │
  │        │              │        │ virtual-list │      │                │
  │        │              │        │   5 消费者    │      │                │
  │        │              │        └──────────────┘      │                │
  └────────┼──────────────┼──────────────┬──────────────┼────────────────┘
           │              │              │              │
  ┌────────┼──────────────┼──────────────┼──────────────┼────────────────┐
  │ L2     │              └──────┬───────┴──────────────┘                │
  │        │                     ▼                                        │
  │        │              ┌─────────────┐   ┌───────────┐ ┌────────────┐ │
  │        └─────────────►│   overlay   │   │ form-core │ │   picker   │ │
  │                       │  15 消费者   │   │ 16 消费者  │ │  3 消费者   │ │
  │                       └──────┬──────┘   └─────┬─────┘ └─────┬──────┘ │
  │                              │                │             │        │
  │                       ┌──────┴────────────────┴─────────────┴──────┐ │
  │                       │              locale（生成物）                │ │
  │                       └─────────────────────┬──────────────────────┘ │
  └─────────────────────────────────────────────┼────────────────────────┘
                                                ▼
                                    ┌───────────────────────┐
                                    │  L3  @apollo-design/ui │
                                    │      72 个组件          │
                                    └───────────────────────┘
```

### 4.1 每个包的职责、替代对象与明确不做

| 包 | 层 | 替代 antd 的 | 明确不做 |
|---|---|---|---|
| `utils` | L0 | `@rc-component/util`、`resize-observer`、`mutate-observer`、`throttle-debounce` | 不含视觉语义；不产 CSS；不依赖任何 `@apollo-design/*`；不提供 `render/unmount`（含 Vue 渲染器耦合，归 `ui/src/_internal`） |
| `theme` | L0 | `@ant-design/cssinjs` 的 Token 派生部分 | **不做运行时 CSS-in-JS 注入**（见 §5）；不产组件样式 |
| `icons` | L0 | `@ant-design/icons` | 不手写图标；不做图标以外的组件 |
| `motion` | L1 | `@rc-component/motion` | 不做具体组件的动画编排（各组件自己声明）；不做 CSS-in-JS |
| `portal` | L1 | `@rc-component/portal` | 不做定位；不做焦点管理（归 `a11y`） |
| `position` | L1 | `@rc-component/trigger` 的几何部分 | **不做触发时机、延迟、关闭行为**（归 `overlay`）；不碰 DOM 生命周期 |
| `a11y` | L1 | antd 内散落的 `rc-*` a11y 逻辑 | 不做视觉；不替代各组件的语义标签职责 |
| `virtual-list` | L1 | `@rc-component/virtual-list` | 不做数据源管理；不做选择态 |
| `overlay` | L2 | `@rc-component/trigger` 的生命周期部分 | 不做几何计算（归 `position`）；不做组件外观 |
| `locale` | L2 | antd `locale/` | 不做运行时 i18n 框架（用 `ConfigProvider` 覆盖） |
| `form-core` | L2 | `@rc-component/form` + `async-validator` | 不做 Form.Item 的布局与错误展示（归 `ui`） |
| `picker` | L2 | `@rc-component/picker` | 不做输入框外观（归 `ui`）；不做日期库（用 dayjs） |
| `test-utils` | T | antd `tests/shared/*` | 不发布；不产生产代码 |

---

## 5. Theme / Token Runtime

### 5.1 实测的 Token 层级

```
Seed (34)  ──►  Map (140)  ──►  Alias (82 own / 222 effective)  ──►  Component (70 组 / 517 个)
  基础色/圆角/      由 seed 派生的       面向消费的语义别名              每个组件自己的可调项
  字号/间距/线宽    中间层（如色板 1-10）  （colorText / colorPrimary…）
```

全部数字来自 `registry/tokens.json`（由 antd 6.6.4 产物提取），**不是估算**。

### 5.2 关键决策：零运行时 CSS 变量

antd 用 `@ant-design/cssinjs` 在运行时生成带 hash 的 class 与样式表。本项目**不用**：

| | antd（CSS-in-JS） | 本项目（CSS 变量） |
|---|---|---|
| 运行时开销 | 有（生成 + 注入样式表） | 零 |
| 动态主题 | 重新生成样式表 | 重写 `--apollo-*` 变量 |
| 产物 | JS 里含样式 | 独立 `.css`，可被打包器单独处理 |
| hash class | 有（隔离） | 无（靠 `prefixCls` + CSS 变量作用域） |
| SSR | 需要样式收集 | 天然支持 |

代价是：**动态 Token 的实现复杂度落在 `theme` 包上**（运行时改 token 需要把变量重写到
`:root` 或作用域元素）。这个代价被接受，因为"零运行时"是本项目相对 antd 的核心优势之一。

> ⚠️ 该决策的边界（是否**只**支持零运行时模式）由开放决策 `zero-runtime-mode` 待裁决。

### 5.3 三层样式产物

```
1. packages/theme/dist/tokens.css     :root { --apollo-color-primary: ...; }   ← 全局 Token 变量
2. packages/theme/dist/<theme>.css    dark / compact / compact-dark 的变量覆盖
3. packages/ui/dist/<component>.css   组件样式，全部引用 var(--apollo-*)
```

组件样式中**不允许出现颜色/圆角/间距/字号的字面值** —— 由 `registry:validate` 的 E10 检查。

---

## 6. 目录约定

### 6.1 包内目录（`packages/<pkg>/`）

```
packages/<pkg>/
├── src/
│   ├── index.ts              # 唯一入口
│   ├── composables/          # 该包能力相关的 composable（见 §6.3）
│   └── __tests__/
├── package.json
├── tsconfig.json             # extends 根配置
├── tsconfig.build.json
└── README.md
```

### 6.2 组件目录（`packages/ui/src/<component>/`）

```
<component>/
├── index.ts                  # 导出组件 + 类型
├── <Component>.vue           # 主组件
├── <Sub>.vue                 # 子组件（如 Option / TabPane）
├── composables/              # 仅本组件使用的 composable
├── engine/                   # 仅本组件使用的内部引擎（未达提取标准的）
├── style/
│   └── index.css
├── __tests__/
│   ├── <name>.test.ts        # L1 单元 + L2 交互
│   ├── <name>.test-d.ts      # L3 类型（含负例）
│   └── <name>.a11y.test.ts   # L5 无障碍
├── demo/                     # 文档 demo（与 antd 的 demo 一一对应）
└── index.zh-CN.md            # 组件文档
```

### 6.3 composables 的三层共置（不建 hooks 包）

Vue 的 composable 与组件实例强耦合，抽成独立包会退化成"什么都能放的垃圾桶"。
因此按耦合度分三层落位：

| 层 | 位置 | 判据 | 例 |
|---|---|---|---|
| **框架无关** | `packages/utils/src/hooks/` | 不需要 `inject/provide`、不需要组件生命周期 | `useEvent`、`useMergedState`、`useLayoutEffect` |
| **包能力相关** | `packages/<pkg>/src/composables/` | 与本包职责绑定，跨组件复用 | `useFocusTrap`（a11y）、`useAlign`（position） |
| **组件耦合** | `packages/ui/src/<component>/composables/` | 只服务一个组件 | `useTableSorter`、`useTreeExpand` |

> 该决策记录为 `openDecisions[hooks-package-vs-colocated]`（状态 `decided`）。

---

## 7. 测试架构（七层）

| 层 | 名称 | 落点 | 适用 |
|---|---|---|---|
| **L1** | 单元 | `vitest --project unit` | 全部 |
| **L2** | 交互 | `vitest --project unit`（`@vue/test-utils`） | 有交互的组件 |
| **L3** | 类型 | `vitest --project types`（`*.test-d.ts`）+ `vue-tsc` | 全部 |
| **L4** | DOM 契约 | `vitest --project dom-contract` | 全部（与 antd 的 DOM 结构比对） |
| **L5** | 无障碍 | `vitest --project a11y`（`axe-core`） | 有交互/语义的组件 |
| **L6** | 视觉回归 | `tests/visual/`（Playwright + pixelmatch） | 有视觉的组件 |
| **L7** | 构建 | `tests/build/`（产物契约 + publint） | 全部包 |

覆盖率阈值：**基础设施包 95 / 90 / 95**（语句 / 分支 / 函数），`packages/ui` 90 / 85 / 90。
`icons` 与 `locale` 是生成物，豁免覆盖率要求。

`n/a` 的层必须由架构规则支撑（例如 L0 无视觉语义 ⇒ L6 不适用），
不允许用 `n/a` 掩盖未做 —— 由 E16 强制要求填写 `layerNotes`。

---

## 8. 构建与产物契约

### 8.1 现状（⚠️ 存在未裁决的阻断）

`scaffold-packages.mjs` 生成的 `package.json` 在 `exports` 中声明了 `./es/*` 与 `./css/*`，
`files` 中列出了 `es` 与 `css`，但 `scripts.build` 是裸 `unbuild` —— 默认只产出 `dist/` 单文件包。
结果是：

- `unbuild` 报 `Could not find entrypoint for ./es/*` 并以退出码 1 失败
- **`pnpm -r build` 当前对全部包不可用**
- L7 构建门禁事实上不存在

这是**实现与文档不一致**，不是配置小问题。三个选项记录在
`registry/foundation.json → openDecisions[build-output-contract]`：

| 选项 | 内容 | 代价 |
|---|---|---|
| A | 只保留 `dist/`（单文件打包） | 失去组件级深导入，与本文档 §3.2 矛盾 |
| B | `es/`（mkdist 保留模块结构）+ `dist/`（unbuild 单文件）**〔推荐〕** | 每包多一套构建配置与产物 |
| C | `es/` 用 Vite/Rollup `preserveModules` 自配 | 偏离已锁定的 unbuild 选型，成本最高 |

**在裁决前，任何包的 `pkg` 维度都无法收口**（`@apollo-design/utils` 当前状态 `blocked` 就是这个原因，
它代码层面已完成：37 个源文件 / 3611 行 / 131 个导出 / 643 个测试 / 98% 语句覆盖率）。

### 8.2 版本管理

- pnpm **12.4.2**（`packageManager` 锁定，通过 corepack 激活）
- 依赖版本统一走 `pnpm-workspace.yaml` 的 `catalog:`，**禁止在 package.json 里硬编码已入 catalog 的版本**
- `allowBuilds` 白名单只放行真正需要 native 二进制的包（当前只有 `esbuild`）
- 工作区依赖一律 `workspace:*`

---

## 9. 架构风险与 PoC

| 编号 | 风险 | 为什么是风险 | PoC 方式 |
|---|---|---|---|
| **AR1** | 浮层定位 | antd 的 `@rc-component/trigger` 把几何计算与生命周期揉在一起。我们的 `position` 必须独立提供 12 个对齐点 + 翻转 + 溢出处理 + 箭头定位，且与 antd 的视觉结果一致 | 纯函数 + 尺寸测量，在 jsdom 中验证几何；与 antd 参考截图逐像素比对。不需要碰触发时机（`FND:position:poc`） |
| **AR2** | 动效语义 | antd 的 motion 需要覆盖 collapse / slide / zoom / fade / move 五类语义，Vue 的 `Transition` 与 rc-motion 的能力边界不同 | 单独验证五类语义在 Vue `Transition` + CSS 变量下的可实现性（`FND:motion:poc`） |

两个 PoC 都排在 **W1**，早于其依赖的完整实现 —— 这是刻意的：先证伪，再投入。
`pocRequired` 字段在 `foundation.json` 中标记这一点，`registry:validate` 的 E15 会检查
「`pocRequired === false` 的包不得早于其依赖」。

---

## 10. 已知缺陷与开放决策

### 10.1 已发现但尚未修的门禁缺陷

| 编号 | 缺陷 | 影响 | 状态 |
|---|---|---|---|
| **D1** | 构建产物契约未落实（§8.1） | `pnpm -r build` 全失败，L7 门禁不存在 | 待裁决 `build-output-contract` |
| **D2** | `tests/build/run.mjs` 缺失（`package.json` 的 `test:build` 指向它） | L7 层无执行体 | 待实现 |
| **D3** | `tsconfig.build.json` 是悬空引用（各包 scripts 引用但文件不存在） | `build:types` 不可用 | 待实现 |
| **D4** | `biome.json` 按 2.0.0 schema 编写，实际安装 2.5.13 | `lint:format` 从未真正生效 | ✅ 已修（migrate + ignores + overrides） |
| **D5** | `a11y` / `theme` 两个 vitest project 无测试文件，`pnpm test` 常年红 | 主测试命令不可信 | ✅ 已修（CLI `--passWithNoTests`） |

### 10.2 全部开放决策

决策不活在对话里，活在 `registry/foundation.json → openDecisions`（内容种子在
`registry/source/open-decisions.mjs`）。当前 11 项，9 项待裁决：

```
node registry/tools/foundation-status.mjs        # 查看全部决策与建议
node registry/tools/gen-workstreams.mjs          # 查看决策如何阻塞并行批次
```

---

## 11. 与 Registry 的关系

本文件的约束**不是靠人遵守**，而是靠工具检查：

```
pnpm run registry:check
  ├── registry:gen              components.json / dependencies.json / tokens.json
  ├── registry:foundation:check foundation.json 与源数据一致（否则 exit 1）
  ├── registry:workstreams:check workstreams.json 与源数据一致（否则 exit 1）
  └── registry:validate         E1–E18 共 17 项检查
```

任何一条失败都会让 CI 变红。**文档说的不算，工具说的算。**
