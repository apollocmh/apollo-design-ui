---
title: Modal 对话框
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

模态对话框。用于需要用户处理事务、又不希望跳转页面导致流程中断的场景。

## 何时使用

- 需要用户**集中注意力**处理一件事（表单、确认、警告）时。
- 需要**命令式**弹出（`Modal.confirm(...)` / `Modal.info(...)`）时。
- 需要在弹窗内做焦点约束（焦点陷阱 + 关闭后归还焦点）时。

:::

## 代码演示

::: v-pre

**async**：点击确定后异步关闭对话框，例如提交表单。

:::

<DemoPreview component="modal" demo="async" />

::: v-pre

**basic**：第一个对话框。

:::

<DemoPreview component="modal" demo="basic" />

::: v-pre

**button-props**：传递属性给按钮，例如：修改按钮的基础属性。

:::

<DemoPreview component="modal" demo="button-props" />

::: v-pre

**component-token**：修改组件单独 token，标题行高、字体大小、字体颜色。

:::

<DemoPreview component="modal" demo="component-token" />

::: v-pre

**confirm-router**：在确认框里做「跳转」这类有副作用的操作（上游用路由，本 demo 用一段状态代替）。

:::

<DemoPreview component="modal" demo="confirm-router" />

::: v-pre

**confirm**：使用 `confirm()` 可以快捷地弹出确认框。

:::

<DemoPreview component="modal" demo="confirm" />

::: v-pre

**custom-mouse-position**：通过 `mousePosition` 指定动画展开的原点。

:::

<DemoPreview component="modal" demo="custom-mouse-position" />

::: v-pre

**dark**：暗色主题下的对话框（`darkAlgorithm`）。
> 对齐 antd `demo/dark.tsx` 的**意图**：上游把整个 antd 的暗色示例塞进弹窗；
> 本 demo 只保留「暗色主题 + Modal + 一小组内容组件」。`Slider` / `Timeline` 尚未落地，
> 内容区用纯文本代替。

:::

<DemoPreview component="modal" demo="dark" />

::: v-pre

**footer-render**：自定义页脚渲染函数，可以复用默认页脚组件（`OkBtn` / `CancelBtn`）。

:::

<DemoPreview component="modal" demo="footer-render" />

::: v-pre

**footer**：更复杂的例子，自定义了页脚的按钮，点击提交后进入 loading 状态，完成后关闭。

:::

<DemoPreview component="modal" demo="footer" />

::: v-pre

**hooks**：通过 `useModal` 钩子调用 modal 的方法，返回的实例可以更新与销毁。

:::

<DemoPreview component="modal" demo="hooks" />

::: v-pre

**loading**：设置 `loading` 属性后，内容区域会展示骨架屏。

:::

<DemoPreview component="modal" demo="loading" />

::: v-pre

**locale**：通过 `okText` / `cancelText` 定制按钮文案。

:::

<DemoPreview component="modal" demo="locale" />

::: v-pre

**manual**：手动更新和移除，配合定时器演示。

:::

<DemoPreview component="modal" demo="manual" />

::: v-pre

**mask**：遮罩的三种形态：模糊 / 半透明 / 不渲染。

:::

<DemoPreview component="modal" demo="mask" />

::: v-pre

**modal-render**：自定义对话框的渲染节点（`modalRender`），并用语义槽定制标题栏。

:::

<DemoPreview component="modal" demo="modal-render" />

::: v-pre

**nested**：嵌套弹窗，三层叠加。

:::

<DemoPreview component="modal" demo="nested" />

::: v-pre

**position**：通过 `style.top` 与 `centered` 控制对话框的垂直位置。

:::

<DemoPreview component="modal" demo="position" />

::: v-pre

**render-panel**：调试用面板（`_InternalPanelDoNotUseOrYouWillBeFired`），不 portal、不遮罩、不动效。

:::

<DemoPreview component="modal" demo="render-panel" />

::: v-pre

**static-info**：各种类型的消息对话框，通过静态方法调用。

:::

<DemoPreview component="modal" demo="static-info" />

::: v-pre

**style-class**：通过 `classNames` / `styles` 语义槽定制对话框的各个区域（支持函数形态）。

:::

<DemoPreview component="modal" demo="style-class" />

::: v-pre

**width**：设置 `width` 自定义对话框宽度。

:::

<DemoPreview component="modal" demo="width" />

::: v-pre

**wireframe**：线框化风格（`wireframe` 主题）。

:::

<DemoPreview component="modal" demo="wireframe" />

::: v-pre

## API

### 组件式 `<Modal>`

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| open | 是否显示 | `boolean` | `false` |
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
| onOk / onCancel | 确定 / 取消（含遮罩、关闭按钮、ESC） | `(e: Event) => void` | — |
| afterClose / afterOpenChange | 关闭动效结束 / 动效结束（开与关都触发） | `() => void` / `(open: boolean) => void` | — |
| getContainer | 容器；`false` ⇒ **内联渲染**（不 portal） | `false \| string \| HTMLElement \| () => HTMLElement` | `document.body` |
| zIndex | 层级 | `number` | — |
| keyboard | ESC 可关 | `boolean` | `true` |
| scrollLock | 打开时锁 body 滚动 | `boolean` | `true` |
| forceRender | 没开也渲染 | `boolean` | `false` |
| destroyOnHidden | 关闭后卸载 | `boolean` | `false` |
| modalRender | 自定义面板渲染（包一层 `-render`） | `(node) => VNodeChild` | — |
| mousePosition | zoom 动效的原点 | `{ x, y } \| null` | — |
| focusable | 焦点行为：`{ trap?, focusTriggerAfterClose? }` | — | `trap` 跟 `mask`；`focusTriggerAfterClose: true` |
| panelRef | 面板根节点（透传给 watermark） | `Ref \| Function` | — |
| classNames / styles | 9 个语义槽（运行时**也接受函数形态**） | — | — |

**deprecated（dev 告警）**：`bodyStyle` → `styles.body`；`maskStyle` → `styles.mask`；
`destroyOnClose` → `destroyOnHidden`；`focusTriggerAfterClose` → `focusable.focusTriggerAfterClose`；
`maskClosable` → `mask.closable`；`autoFocusButton` → `focusable.autoFocusButton`。

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
| `then(resolve)` | ⚠️ 实例是 **thenable**：`await Modal.confirm(...)` 拿到确认结果，且此后关闭**不再触发 `onCancel`** |

`ModalFuncProps` 比 `ModalProps` 多 `content` / `icon` / `type` / `okCancel` /
`autoFocusButton` / `focusable.autoFocusButton`，`width` 只收 `string | number`。

### 语义化槽位（9 个）

```
root / container / wrapper / mask / header / title / body / footer / close
```

⚠️ 在 `ConfirmDialog` 里 `body` / `mask` 会被摘出来，改挂到 `-confirm-content` 上。

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
   ⚠️ 只有 **deprecated 的顶层 `autoFocusButton`** 能表达「不聚焦」（`null`）；
   `focusable.autoFocusButton: null` 会被上游的 `||` 吃掉、退回 `'ok'`。

## 与 antd 的已知差异

见 `COMPATIBILITY.md` 的差异登记表。要点：无 `ContextIsolator`（form / space 隔离，
D36）；无 cssinjs 的 hash / `-css-var` 类；命令式路径用游离 `div` 承载 Vue 应用
（React 用 `DocumentFragment`）；不实现 `holderRender`。

:::
