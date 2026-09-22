---
category: 布局
title: Layout
subtitle: 布局
---

协助进行页面级整体布局。

## 何时使用

- 需要搭建页面的整体骨架（顶部导航 / 侧边导航 / 内容区 / 页脚）时。
- 侧边栏需要收起、响应式断点、自定义触发器时（用 `Layout.Sider`）。

## 代码演示

见 [`demo/`](./demo)（11 个，与 antd 非 debug demo 一一对应）。

> 本仓 `Menu` / `Breadcrumb` 尚未落地，演示里的导航用等价的原生结构。

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
