---
category: 反馈
title: Alert
subtitle: 警告提示
---

警告提示，展现需要关注的信息。

## 何时使用

- 当某个页面需要向用户显示警告的信息时使用。
- 非浮层的静态告诫，用户可点击关闭。

## 代码演示

见 [`demo/`](./demo)（13 个，与 antd 非 debug demo 一一对应）。

| demo | 内容 |
|---|---|
| `basic` | 基本 |
| `description` | 四种样式 + 辅助文字 |
| `closable` | 可关闭（closable 对象 + aria-label） |
| `icon` / `custom-icon` | 图标 / 自定义图标 |
| `banner` | 顶部公告 |
| `action` | 自定义操作项 |
| `filled` | 填充态（variant） |
| `smooth-closed` | 平滑卸载（afterClose） |
| `style-class` | 语义化 classNames / styles |
| `custom-title-alignment` | 标题换行对齐（styles 微调） |
| `loop-banner` | 轮播公告（CSS 跑马灯等价实现） |
| `error-boundary` | 错误边界（onErrorCaptured） |

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 提示类型 | `'success' \| 'info' \| 'warning' \| 'error'` | `banner ? 'warning' : 'info'` |
| variant | 形态（6.4.0+） | `'outlined' \| 'filled'` | `'outlined'` |
| title | 标题（prop / `#title` 插槽，prop 优先） | `string` | — |
| message | **@deprecated** 请用 `title` | `string` | — |
| description | 辅助描述（prop / `#description` 插槽，prop 优先） | `string` | — |
| showIcon | 是否显示图标（banner 且未传 ⇒ true） | `boolean` | — |
| banner | 顶部通告形态 | `boolean` | `false` |
| closable | 可关闭（对象形态恒可关，可带 closeIcon/onClose/afterClose 与任意 aria-*/data-*） | `boolean \| AlertClosable` | ConfigProvider |
| closeIcon | **@deprecated** 请用 `closable.closeIcon`（`null/false` ⇒ 不可关） | `string \| boolean \| null` | — |
| closeText | **@deprecated** 请用 `closable.closeIcon` | `string` | — |
| onClose | **@deprecated** 请用 `closable.onClose` | `(e: MouseEvent) => void` | — |
| afterClose | **@deprecated** 请用 `closable.afterClose` | `() => void` | — |
| id / role | 根元素属性（role 默认 `'alert'`，可覆盖） | `string` | — |
| classNames / styles | 语义槽位（root / icon / section / title / description / actions / close），对象或函数 | — | — |
| onMouseenter / onMouseleave / onClick | 根元素事件 | `(e: MouseEvent) => void` | — |

### 插槽（Slots）

| 插槽 | 说明 |
|---|---|
| `#title` | 标题富内容（prop 优先）。 |
| `#description` | 辅助描述富内容（prop 优先）。 |
| `#icon` | 自定义图标，**覆盖**默认类型图标（原 `icon` prop，已移除）。 |
| `#action` | 操作区内容（原 `action` prop，已移除）。 |

### Alert.ErrorBoundary

错误边界包裹组件（Vue 由 `onErrorCaptured` 实现）：捕获后代渲染错误后渲染
`type="error"` 的 Alert（title 缺省用 `error.toString()`，描述缺省用组件栈 `<pre>`）。

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLDivElement \| null` |

## Theme（Component Token）

| token | 说明 | 默认值 |
|---|---|---|
| borderRadius | 圆角 | `borderRadiusLG`（8） |
| withDescriptionIconSize | 带描述时图标字号 | `fontSizeHeading3`（30） |
| defaultPadding | 无描述内边距 | `8px 12px` |
| withDescriptionPadding | 带描述内边距 | `20px 24px` |
