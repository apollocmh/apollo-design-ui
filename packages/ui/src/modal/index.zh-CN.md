---
category: 反馈
title: Modal
subtitle: 对话框
---

模态对话框。用于需要用户处理事务、又不希望跳转页面导致流程中断的场景。

## 何时使用

- 需要用户**集中注意力**处理一件事（表单、确认、警告）时。
- 需要**命令式**弹出（`Modal.confirm(...)` / `Modal.info(...)`）时。
- 需要在弹窗内做焦点约束（焦点陷阱 + 关闭后归还焦点）时。

## 代码演示

见 [`demo/`](./demo)（23 个，覆盖 antd 的主要用户场景）。

## API

### 组件式 `<Modal>`

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| open / v-model:open | 是否显示；取消/关闭请求 false，确定只通知 | `boolean` | `false` |
| title | 标题（同名 `#title` slot 优先） | `string` | — |
| width | 宽度（可传响应式断点对象） | `string \| number \| Partial<Record<Breakpoint, string \| number>>` | `520` |
| height | 高度 | `string \| number` | — |
| loading | 内容区骨架态（**此时 footer 强制不渲染**） | `boolean` | `false` |
| centered | 垂直居中 | `boolean` | `false` |
| closable | 关闭按钮。`false` ⇒ 不渲染；对象可给 `disabled` / `onClose` / `afterClose` | `boolean \| {...}` | `true` |
| mask | 遮罩。`false` ⇒ 无遮罩；对象可给 `enabled` / `blur` / `closable` | `boolean \| { enabled?, blur?, closable? }` | `true` |
| okText / cancelText | 按钮文案（同名 `#okText` / `#cancelText` slot 优先） | `string` | locale（OK / Cancel） |
| okType | 确定按钮类型 | `'text' \| 'link' \| 'primary' \| 'default' \| 'dashed'` | `'primary'` |
| confirmLoading | 确定按钮 loading（**为真时点取消不关**） | `boolean` | `false` |
| okButtonProps / cancelButtonProps | 确定/取消按钮属性；根类名用 Vue 原生 `class`（不是 `className` / `rootClassName`） | `ModalButtonProps` | — |
| getContainer | 容器；`false` ⇒ **内联渲染**（不 portal） | `GetContainer` (Portal; includes Element / ShadowRoot / function / false) | `document.body` |
| zIndex | 层级 | `number` | — |
| keyboard | ESC 可关 | `boolean` | `true` |
| scrollLock | 打开时锁 body 滚动 | `boolean` | `true` |
| forceRender | 没开也渲染 | `boolean` | `false` |
| destroyOnHidden | 关闭后卸载 | `boolean` | `false` |
| mousePosition | zoom 动效的原点 | `{ x, y } \| null` | — |
| focusable | 焦点行为：`{ trap?, focusTriggerAfterClose? }` | — | `trap` 跟 `mask`；`focusTriggerAfterClose: true` |
| panelRef | 面板根节点（透传给 watermark） | `Ref \| Function` | — |
| classNames / styles | 9 个语义目标；对象或接收当前 `{ props: ModalProps }` 的函数 | `ModalProps["classNames"] / ModalProps["styles"]` | — |

**deprecated（dev 告警）**：`bodyStyle` → `styles.body`；`maskStyle` → `styles.mask`；
`destroyOnClose` → `destroyOnHidden`；`focusTriggerAfterClose` → `focusable.focusTriggerAfterClose`；
`maskClosable` → `mask.closable`；`autoFocusButton` → `focusable.autoFocusButton`。

### 事件与插槽

| 事件 | 参数 | 说明 |
|---|---|---|
| `update:open` | `boolean` | 取消/关闭请求；受控父级拒绝时保持真实显示状态 |
| `ok` | `Event` | 确定通知；父级管理异步 loading 和关闭 |
| `cancel` | `Event` | 取消按钮、关闭按钮、遮罩或 Escape |
| `afterClose` | 无 | 关闭动效结束 |
| `afterOpenChange` | `boolean` | 开启/关闭动效结束 |

| 插槽 | 作用域 | 内容 |
|---|---|---|
| default | — | 正文 |
| title / okText / cancelText / closeIcon | — | 具名内容；空插槽隐藏内容 |
| footer | `{ OkBtn, CancelBtn }` | 稳定的操作组件，消费当前按钮配置和事件 |
| modalRender | `{ ModalPanel }` | 稳定的当前面板组件；通过 `<component :is="ModalPanel" />` 包装 |

原生 `class`、`style`、`id`、ARIA、data 属性及监听落到实际面板。
`panelRef` 接收 `HTMLElement | null`；组件不承诺 focus/blur 方法。
未传 `open` 时初始关闭；撤销受控后保留最后一次接收的值，不泄漏被父级拒绝的提议。

### 命令式（静态方法）

| 方法 | 说明 |
|---|---|
| `Modal.confirm(config)` / `info` / `success` / `error` / `warning` / `warn` | 弹出一个确认框。`warning` 与 `warn` **是同一个函数** |
| `Modal.destroyAll()` | 关闭全部命令式实例 |
| `Modal.useModal()` | 返回 `[api, contextHolder]`，`api` 有同样 6 个方法 |
| `Modal.config({ rootPrefixCls })` | **已废弃**，请用 `ConfigProvider.config` |
| `Modal._InternalPanelDoNotUseOrYouWillBeFired` | 私有静态面板（**不 portal、不遮罩、不动效**），供文档与调试 |

命令式实例（`Modal.confirm(...)` / `useModal()` 的返回值）：

| 成员 | 说明 |
|---|---|
| `destroy()` | **关闭**（走动效 + `afterClose` 后卸载），不是立即卸载 |
| `update(config)` | 更新配置（对象浅合并，或传函数） |
| `then(resolve, reject)` | 仅 Hook 实例支持：`await api.confirm(config)` 在确认时得到 `true`，取消、销毁或 holder/owner 卸载时得到 `false` |

命令式 `onOk(close)` / `onCancel(close)` 是服务：返回 Promise 时进入 loading，成功后关闭，
拒绝则保持打开。程序内容 `footer(originNode, { OkBtn, CancelBtn })`、`modalRender(node)`
以及 `afterClose` / `afterOpenChange` 仍是 config 函数。关闭中或已关闭的实例忽略更新，
完成后从 `destroyAll` 注册中移除。Hook holder 挂载前的命令会保留，提前销毁则不再挂载。

`ModalFuncProps` 比 `ModalProps` 多 `content` / `icon` / `type` / `okCancel` /
`autoFocusButton` / `focusable.autoFocusButton`，`width` 只收 `string | number`。

### 语义化槽位（9 个）

```
root / container / wrapper / mask / header / title / body / footer / close
```

⚠️ 在 `ConfirmDialog` 里 `body` 会被摘出来，改挂到 `-confirm-content` 上。

## Theme（Component Token）

公开 6 个（可经 `theme.components.Modal` 覆盖）：`headerBg`(transparent) /
`footerBg`(transparent) / `titleLineHeight`(`lineHeightHeading5`) /
`titleFontSize`(`fontSizeHeading5`) / `titleColor`(`colorTextHeading`) /
`contentBg`(`colorBgElevated`)。

另有 **12 个 internal** token（同样落成 CSS 变量，但不在公开类型面）：
`contentPadding` / `headerPadding` / `headerBorderBottom` / `headerMarginBottom` /
`bodyPadding` / `footerPadding` / `footerBorderTop` / `footerBorderRadius` /
`footerMarginTop` / `confirmBodyPadding` / `confirmIconMarginInlineEnd` /
`confirmBtnsMarginTop` —— 全部随 `wireframe` 主题切换两套值。

## 焦点（a11y 硬要求）

1. **焦点陷阱**：`focusable.trap`（默认跟 `mask` 走）+ `visible` + 容器 `position: fixed`
   三个门都真才启用；
2. **焦点归还**：关闭后焦点回到打开前的元素（`focusable.focusTriggerAfterClose`，默认 `true`）；
   ⚠️ 上游把这条额外门控在 `mask` 上 —— **无遮罩的对话框不归还焦点**（跟随上游）；
3. **`autoFocusButton`**：确认框默认聚焦确定按钮。
   `focusable.autoFocusButton: null` 显式关闭按钮自动聚焦；旧顶层字段的 `null` 同样有效。

## 与 antd 的已知差异

见 `COMPATIBILITY.md` 的差异登记表。要点：无 `ContextIsolator`（form / space 隔离，
）；无 cssinjs 的 hash / `-css-var` 类；命令式路径用游离 `div` 承载 Vue 应用
（React 用 `DocumentFragment`）；不实现 `holderRender`。

## 迁移

普通组件 `afterClose` / `afterOpenChange` props 改为 `@after-close` /
`@after-open-change`（`h()` 中使用 `onAfterClose` / `onAfterOpenChange`）；`@ok` 和
`@cancel` 为类型化 Vue 事件。普通 `modalRender` 改为 `#modalRender` 并渲染作用域中的
`ModalPanel` 组件。普通 footer 内容使用 `#footer` 及其中的按钮组件。
命令式 config 的业务服务与程序内容职责保留。

普通旧 `focusTrap` 声明未被 runtime 消费，已移除，使用 `focusable.trap`。命令式
config 的旧 `open` 继承字段也没有统一有效消费，现已移除：调用即打开，`destroy()`
关闭，`update()` 仅更新仍存活会话的内容与有效配置，不负责重开。

命令式 `update({ confirmLoading: true })` 可显式显示确定按钮加载态并阻止点击；
更新为 `false` 后恢复业务 Promise 自身的 loading，尚未结算的 Promise 仍显示加载态。
