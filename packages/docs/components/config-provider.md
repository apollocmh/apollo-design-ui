---
title: ConfigProvider 全局配置
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

为整个子树统一提供**主题**、**语言**、**尺寸**、**禁用**、**类名前缀**等运行时配置。

## 何时使用

- 应用级一次性包住根组件（或大型特性区域的入口），让下游所有组件自动跟随。
- 想切换语言、暗色主题、紧凑模式、组件前缀……都从这里入手。
- 想覆盖某个组件的默认 props（`Empty` 的 `description`、`Spin` 的 `indicator`、……）用 `components.xxx` 字段。

:::

## 代码演示

::: v-pre

**component-config**：已落地的组件（`empty` / `divider` / `spin` / `form`）有**精确类型**的 prop；
其余组件走 `components` 弱类型逃生口：

:::

<DemoPreview component="config-provider" demo="component-config" />

::: v-pre

**locale**：`locale` 会传导到整棵子树，下游组件用 `useLocale('<ComponentName>')` 读取。
语言包来自 `@apollo-design/locale`（73 个，从 antd 6.6.4 的 `es/locale/*` 生成）。
`ComponentName` 与 antd 一致：`Empty` / `Table` / `Form` / `Pagination` …
⚠️ 已知限制：`useLocale` 目前**不是响应式**的（`locale` 包的设计未决项 D24），
切换 `locale` 后需要让子树重新挂载才能拿到新文案。
`ConfigProvider` 这一侧的接线是响应式的（context 里的值会立刻变）。

:::

<DemoPreview component="config-provider" demo="locale" />

::: v-pre

**prefix-cls**：`prefixCls` 会传给整棵子树，且**内层没给时继承外层**（与 antd 的 `nest prefixCls` 行为一致）。
默认值是 `apollo`（裁决 `prefix-cls-default` = A）。静态 CSS 同时为 `apollo` 与 `ant`
两份前缀生成了产物，所以设成 `ant` 可以复用既有样式。
⚠️ 自定义前缀（如 `my-app`）需要自行产出 CSS：
`genComponentCss('empty', 'my-app')` —— 零运行时的固有代价。

:::

<DemoPreview component="config-provider" demo="prefix-cls" />

::: v-pre

**size-disabled**：`componentSize` 与 `componentDisabled` 是**两条独立的 context**（与 antd 同），
下游用 `useSize()` / `useDisabled()` / `useConfig()` 读取。
两条判据**不同**，不能统一（这是最容易写错的地方）：
| 开关 | 判据 | 为什么 |
|---|---|---|
| `componentSize` | `componentSize \|\| 父级` | 未设置就继承 |
| `componentDisabled` | `componentDisabled ?? 父级` | `false` 必须能**显式关闭**父级的 `true` |
⚠️ 返回值是 `ComputedRef`（要 `.value`），不是 antd 那样的裸值 ——
裸值在 Vue 里等于把配置在 setup 期定死（差异 D27）。

:::

<DemoPreview component="config-provider" demo="size-disabled" />

::: v-pre

**theme**：`theme` 支持 `token` / `algorithm` / `components` / `cssVarPrefix` / `inherit`，
合并语义与 antd 的 `useTheme` 一致（嵌套时 `token` 浅合并、`components` 逐组件合并；
`inherit: false` 时不继承外层）。
**它是怎么生效的**：`ConfigProvider` 调 `getDesignToken()` 算出完整 token，
再用 `createCSSVarScope()` 把 `--apollo-*` 写到作用域元素上。
静态 CSS 只引用 `var(--apollo-*)`，所以主题切换**零样式重算**。
⚠️ 两处已知限制：
1. `theme.components`（Component Token）目前只进 context，**不产出 CSS 变量**
   —— `tokens.css` 只声明 Alias 层（PITFALLS 92）。
2. 给了 `theme` 时，为了让 CSS 变量有地方挂，会多渲染一个 `display: contents`
   的作用域元素（不产生布局盒）。差异登记为 **D26**。

:::

<DemoPreview component="config-provider" demo="theme" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 全局类名前缀 | `string` | `'apollo'` |
| iconPrefixCls | 图标类名前缀 | `string` | `'anticon'`（与 antd 对齐） |
| getPopupContainer | 浮层（弹窗/Tooltip 等）的父元素 | `(trigger?: HTMLElement) => HTMLElement \| ShadowRoot` | — |
| getTargetContainer | 通知/消息等「全屏感知」容器的查找函数 | `() => HTMLElement \| Window \| ShadowRoot` | — |
| renderEmpty | 自定义空状态渲染函数。antd 的 Table / List / Select 等无内容时会调它 | `(componentName?: 'Table' \| 'Table.filter' \| 'List' \| 'Select' \| 'TreeSelect' \| 'Cascader' \| 'Transfer' \| 'Mentions') => unknown` | `defaultRenderEmpty` |
| componentSize | 下游「组件尺寸」统一值（`'small' \| 'medium' \| 'middle' \| 'large'`） | `SizeType` | — |
| componentDisabled | 下游「组件禁用」统一值 | `boolean` | — |
| direction | 文本方向 | `'ltr' \| 'rtl'` | — |
| locale | 语言包 | `Locale`（`@apollo-design/locale`） | — |
| theme | 主题配置 | `{ token?: Record<string, any>; components?: Record<string, any>; algorithm?: MappingAlgorithm; cssVarPrefix?: string; prefixCls?: string; inherit?: boolean }` | — |
| csp | CSP nonce | `{ nonce?: string }` | — |
| variant | 组件形态（`'outlined' \| 'borderless' \| 'filled' \| 'underlined'`） | `Variant` | — |
| virtual | 是否启用虚拟滚动 | `boolean` | `true` |
| popupMatchSelectWidth | 下拉与触发器同宽 | `boolean` | — |
| popupOverflow | 浮层超出视口时的行为 | `'viewport' \| 'scroll'` | — |
| wave | 波纹效果 | `{ disabled?: boolean; triggerType?: 'click' \| 'pointerdown' \| ... }` | — |
| warning | 告警开关 | `{ strict?: boolean; false?: boolean; ... }` | `{}` |
| form | 表单配置 | `{ validateMessages?: ValidateMessages \| ((values) => ValidateMessages); requiredMark?: boolean; colon?: boolean }` | — |
| divider | `Divider` 默认 props | `Partial<DividerProps>` | — |
| empty | `Empty` 默认 props | `Partial<EmptyProps>` | — |
| spin | `Spin` 默认 props | `Partial<SpinProps>` | — |
| components | 其余 53 个组件的默认 props 逃生口（弱类型） | `Record<string, any>` | — |

### 废弃属性

| 旧名 | 新名 |
|---|---|
| `autoInsertSpaceInButton` | `components.button.autoInsertSpace` |
| `dropdownMatchSelectWidth` | `popupMatchSelectWidth` |

### 静态属性 / 具名导出

| 名称 | 说明 |
|---|---|
| `ConfigProvider.ConfigContext` | `useContext` 形态的 context（一般请用 `useConfig`） |
| `ConfigProvider.config` | `getConfig()`：取当前的 `ConfigContext` |
| `ConfigProvider.useConfig` | `useConfig()`：取 `{ componentDisabled, componentSize }` |

## 与 antd 的差异

完整列表见 [`docs/analysis/config-provider.md` §9](../../../../../../../docs/analysis/config-provider.md)，要点：

- **`components` 的类型是渐进式**：已落地的三个组件（`divider` / `empty` / `spin`）有精确 prop；其余 53 个走 `Record<string, any>` 逃生口，等对应组件落地再补精确类型。
- **`theme` 给出时会渲染一个 `display: contents` 的作用域元素承载 CSS 变量**。对布局零影响，但在 Chromium 的 `#stage` 这类 inline 容器里会让 stage 高 1px（D32，不修）。
- **`direction` 的读取必须用 `useDirection()`**：`inject` 只在 setup 解析一次，解构 `useComponentConfig()` 拿到的 `direction` 是快照。
- **不提供** `tooltip` / `popover` / `popconfirm` prop（依赖 `UniqueProvider`，未实现）。

:::
