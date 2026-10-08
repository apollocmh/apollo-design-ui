---
title: Layout 布局
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

协助进行页面级整体布局。

## 何时使用

- 需要搭建页面的整体骨架（顶部导航 / 侧边导航 / 内容区 / 页脚）时。
- 侧边栏需要收起、响应式断点、自定义触发器时（用 `Layout.Sider`）。

:::

## 代码演示

::: v-pre

**basic**：典型的页面布局（Header / Content / Footer 与 Sider 的两种组合）。

:::

<DemoPreview component="layout" demo="basic" />

::: v-pre

**collapsible-overlay**：`collapsedWidth={0}` 时 Sider 完全收起，触发器浮在内容之上（自定义 trigger 图标）。
> 与 antd 的差异：本仓 `Menu` 尚未落地，演示里的导航用等价的原生 `ul/li` 结构。

:::

<DemoPreview component="layout" demo="collapsible-overlay" />

::: v-pre

**component-token**：通过 CSS 变量 `--apollo-layout-*` 覆写 Component Token（等价于 antd 的
`ConfigProvider theme.components.Layout`）。
> 与 antd 的差异：本仓 `Menu` / `Breadcrumb` 尚未落地，演示里用等价的原生结构。

:::

<DemoPreview component="layout" demo="component-token" />

::: v-pre

**custom-trigger**：`trigger={null}` 关掉内置触发器，改用外部按钮控制折叠。
> 与 antd 的差异：本仓 `Menu` 尚未落地，演示里的导航用等价的原生 `ul/li` 结构。

:::

<DemoPreview component="layout" demo="custom-trigger" />

::: v-pre

**fixed-sider**：侧边栏固定（sticky + 自身滚动），适合导航较长的场景。
> 与 antd 的差异：本仓 `Menu` 尚未落地，演示里的导航用等价的原生 `ul/li` 结构。

:::

<DemoPreview component="layout" demo="fixed-sider" />

::: v-pre

**fixed**：头部固定（sticky），内容区滚动。
> 与 antd 的差异：本仓 `Menu` / `Breadcrumb` 尚未落地，演示里用等价的原生结构。

:::

<DemoPreview component="layout" demo="fixed" />

::: v-pre

**responsive**：Layout.Sider 支持响应式布局：配置 `breakpoint` 后，视窗宽度小于断点时 Sider 收起为
`collapsedWidth`，设为 0 会出现特殊 trigger。
> 与 antd 的差异：本仓 `Menu` 尚未落地，演示里的导航用等价的原生 `ul/li` 结构。

:::

<DemoPreview component="layout" demo="responsive" />

::: v-pre

**side**：侧边两列布局 —— 侧边栏导航 + 内容区。
> 与 antd 的差异：本仓 `Menu` 尚未落地，演示里的导航用等价的原生 `ul/li` 结构。

:::

<DemoPreview component="layout" demo="side" />

::: v-pre

**top-side-2**：顶部导航 + 侧边多级导航（内容区带面包屑）。
> 与 antd 的差异：本仓 `Menu` / `Breadcrumb` 尚未落地，演示里用等价的原生结构。

:::

<DemoPreview component="layout" demo="top-side-2" />

::: v-pre

**top-side**：顶部导航 + 侧边导航 + 内容区的三层布局。
> 与 antd 的差异：本仓 `Menu` 尚未落地，演示里的导航用等价的原生 `ul/li` 结构。

:::

<DemoPreview component="layout" demo="top-side" />

::: v-pre

**top**：顶部导航 + 内容区的经典后台布局。
> 与 antd 的差异：本仓 `Menu` 尚未落地，演示里的导航用等价的原生 `ul/li` 结构。

:::

<DemoPreview component="layout" demo="top" />

::: v-pre

## API

### Layout

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| hasSider | 是否有侧边栏（不传 ⇒ 自动检测：已注册的 Sider 或 children 里的 Sider） | `boolean` | — |
| className / rootClassName / style | 根元素属性（**style 覆盖** ConfigProvider 的 layout.style） | — | — |
| prefixCls | 自定义前缀 | `string` | — |

### Layout.Header / Layout.Footer / Layout.Content

| 参数 | 说明 | 类型 |
|---|---|---|
| prefixCls | 传了就**直接用它**（不再拼 `-header` 等后缀） | `string` |
| className / style | 根元素属性 | — |

标签：Header=`header`、Footer=`footer`、Content=`main`。

### Layout.Sider

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| collapsible | 是否可收起 | `boolean` | `false` |
| collapsed | 当前收起状态（受控） | `boolean` | — |
| defaultCollapsed | 非受控初始值 | `boolean` | `false` |
| width | 展开宽度（数字补 px，字符串原样） | `number \| string` | `200` |
| collapsedWidth | 收起宽度（解析为 0 ⇒ 零宽触发器） | `number \| string` | `80` |
| reverseArrow | 翻转箭头方向 | `boolean` | `false` |
| trigger | 自定义触发器（`null` ⇒ 不渲染触发器区） | `VNodeChild` | — |
| zeroWidthTriggerStyle | 零宽触发器样式 | `CSSProperties` | — |
| breakpoint | 响应式断点 | `'xs' \| … \| 'xxxl'` | — |
| theme | 主题 | `'light' \| 'dark'` | `'dark'` |
| classNames / styles | 语义槽 `{ root, body }`（对象或函数，函数收 `{ props }`） | — | — |
| onCollapse | 收起状态变化 | `(collapsed, type: 'clickTrigger' \| 'responsive') => void` | — |
| onBreakpoint | 断点变化（挂载时立即以 `mql.matches` 调一次） | `(broken: boolean) => void` | — |

### 插槽

| 名称 | 说明 |
|---|---|
| default | 内容（Layout 与四组件都支持） |
| trigger | Sider 触发器（prop 优先） |

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLElement \| null` |

## Theme（Component Token）

19 个：`bodyBg` / `headerBg` / `headerHeight` / `headerPadding` / `headerColor` /
`footerPadding` / `footerBg` / `siderBg` / `triggerHeight` / `triggerBg` /
`triggerColor` / `zeroTriggerWidth` / `zeroTriggerHeight` / `lightSiderBg` /
`lightTriggerBg` / `lightTriggerColor` + 三个 deprecated 别名。

:::
