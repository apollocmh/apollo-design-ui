---
category: 其他
title: ConfigProvider
subtitle: 全局配置
---

为整个子树统一提供**主题**、**语言**、**尺寸**、**禁用**、**类名前缀**等运行时配置。

## 何时使用

- 应用级一次性包住根组件（或大型特性区域的入口），让下游所有组件自动跟随。
- 想切换语言、暗色主题、紧凑模式、组件前缀……都从这里入手。
- 想覆盖某个组件的默认 props（`Empty` 的 `description`、`Spin` 的 `indicator`、……）用 `components.xxx` 字段。

## 代码演示

见 [`demo/`](./demo)（5 个：prefix-cls / locale / component-config / size-disabled / theme）。

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