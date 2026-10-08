---
title: Notification 通知提醒框
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

全局展示通知提醒信息，可指定六个方位。命令式 API（`notification.success({ title })`），浮层走 portal。

## 何时使用

- 需要比 `message` 更重、可带**标题 + 描述 + 操作按钮**的通知。
- 需要按方位出现（右上角 / 右下角 / 顶部居中…）。
- 需要「自动关闭倒计时」的进度条（`showProgress`）。
- ⚠️ 优先用 `notification.useNotification()` 的 `contextHolder`：静态方法**无法消费 context**。

:::

## 代码演示

::: v-pre

**basic**：静态方法无法消费 Context，不能动态响应 ConfigProvider 提供的各项配置。请优先使用 hooks 版本或者 App 组件提供的 `notification` 实例。

:::

<DemoPreview component="notification" demo="basic" />

::: v-pre

**component-token**：组件级 token 调试（本仓以默认主题渲染 —— ConfigProvider 的组件级 token 覆盖尚未落地）。

:::

<DemoPreview component="notification" demo="component-token" />

::: v-pre

**custom-icon**：自定义图标。

:::

<DemoPreview component="notification" demo="custom-icon" />

::: v-pre

**duration**：自定义通知框自动关闭的延时，默认 `4.5s`，取消自动关闭只要将该值设为 `0` 即可。

:::

<DemoPreview component="notification" demo="duration" />

::: v-pre

**hooks**：通过 `notification.useNotification` 创建支持读取 context 的 `contextHolder`。请注意，我们推荐通过顶层注册的方式代替 `notification` 静态方法，因为静态方法无法消费上下文。

:::

<DemoPreview component="notification" demo="hooks" />

::: v-pre

**placement**：使用 `placement` 可以配置通知从上面、下面、左上角、右上角、左下角、右下角弹出。

:::

<DemoPreview component="notification" demo="placement" />

::: v-pre

**progress-color**：自定义进度条配色（本仓以默认配色渲染 —— ConfigProvider 的组件级 token 覆盖尚未落地）。

:::

<DemoPreview component="notification" demo="progress-color" />

::: v-pre

**render-panel**：调试用组件，请勿直接使用。

:::

<DemoPreview component="notification" demo="render-panel" />

::: v-pre

**show-with-progress**：显示自动关闭倒计时的进度条。

:::

<DemoPreview component="notification" demo="show-with-progress" />

::: v-pre

**stack**：堆叠配置。超过阈值后自动收起，可以通过 `threshold` 设置触发堆叠的数量。折叠状态下仅展示最新的通知。

:::

<DemoPreview component="notification" demo="stack" />

::: v-pre

**style-class**：通过 `classNames` 和 `styles` 可以自定义通知的语义化结构样式。

:::

<DemoPreview component="notification" demo="style-class" />

::: v-pre

**update**：可以通过唯一的 `key` 来更新内容。

:::

<DemoPreview component="notification" demo="update" />

::: v-pre

**with-btn**：自定义关闭按钮的文案。

:::

<DemoPreview component="notification" demo="with-btn" />

::: v-pre

**with-icon**：图标可以被设置。

:::

<DemoPreview component="notification" demo="with-icon" />

::: v-pre

## API

### 静态方法

| 方法 | 说明 | 签名 |
|---|---|---|
| `notification.success` / `info` / `warning` / `error` | 打开一条对应类型的通知 | `(config: ArgsProps) => void` |
| `notification.open` | 完整配置打开 | `(config: ArgsProps) => void` |
| `notification.destroy` | 关闭（传 key 关一条，不传清空） | `(key?: string \| number) => void` |
| `notification.config` | 全局默认配置（**合并**语义） | `(config: GlobalConfigProps) => void` |
| `notification.useNotification` | hooks 形态 | `(config?) => [NotificationInstance, () => VNode]` |
| `notification._InternalPanelDoNotUseOrYouWillBeFired` | 私有：单条静态面板 | 组件 |
| `notification._InternalListDoNotUseOrYouWillBeFired` | 私有：静态列表 | 组件 |

> ⚠️ **`open()` 返回 `void`** —— 与 `message` 不同，notification 没有 thenable/可调用句柄；
> 也没有 `loading` 类型（`IconType` 只有 4 个值）。

### `ArgsProps`

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 标题 | `VNodeChild` | — |
| description | 描述。与 title 同时存在时包 `-notice-section` | `VNodeChild` | — |
| actions | 操作区 | `VNodeChild` | — |
| type | `'success' \| 'info' \| 'error' \| 'warning'` | — | — |
| placement | 六个方位之一；**单条优先于全局** | `NotificationPlacement` | `'topRight'` |
| duration | 秒；`0` / `false` ⇒ 不自动关闭 | `number \| false` | `4.5` |
| showProgress | 显示自动关闭倒计时进度条 | `boolean` | — |
| pauseOnHover | 悬停暂停计时 | `boolean` | `true` |
| closable | 关闭按钮。`false` / `null` ⇒ **不渲染按钮** | `boolean \| null \| { closeIcon?, disabled?, onClose? }` | `true` |
| closeIcon | 自定义关闭图标；`null` ⇒ 不渲染按钮（上游语义） | `VNodeChild` | — |
| icon | 自定义图标（**给了就不叠 `-notice-icon-{type}` 类**） | `VNodeChild` | 类型图标 |
| role | notice 根的 ARIA 角色 | `'alert' \| 'status'` | `'alert'` |
| key | 唯一标识；同 key 再 open ⇒ 复用同一条 | `string \| number` | 自动生成 |
| onClose / onClick / className / style / classNames / styles / props | 同 antd | — | — |
| message / btn | ⚠️ 已废弃：用 `title` / `actions` | — | — |

### Slots（C8-R2，仅 `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板）

| Slot | 说明 | 参数 |
|---|---|---|
| title | 富标题（文本 `title` prop 等价，slot 优先） | — |
| message | ⚠️ 废弃别名，同 `title` | — |
| description | 富描述（文本 `description` prop 等价，slot 优先） | — |
| icon | 自定义图标（空 slot 等价隐藏） | — |
| actions | 操作区（空 slot 等价隐藏） | — |
| btn | ⚠️ 废弃别名，同 `actions` | — |
| closeIcon | 自定义关闭图标（空 slot 等价隐藏） | — |

> `notification.open({ title, description, icon, actions, closeIcon })` 的命令式入参保持 `VNodeChild`（程序化上下文，无模板）。

### `GlobalConfigProps`（`config()`）

`top` / `bottom` / `duration` / `showProgress` / `pauseOnHover` / `prefixCls` /
`getContainer` / `placement` / `closeIcon` / `closable` / `rtl` / `maxCount` / `props`。

### `NotificationConfig`（`useNotification()`）

同上，另有 `stack`（`boolean | { threshold }`，**默认 `{ offset: 8 }` ⇒ 默认就堆叠**）
与 `classNames` / `styles`。

### 语义化槽位（11 个）

```
list / listContent                                    // 列表级
wrapper / root / title / description / actions / icon / section / close / progress   // 单条级
```

> ⚠️ 本仓只支持**对象形态**（函数式语义槽 PENDING，D36 同判）。

### 类型导出

`NotificationArgsProps`、`NotificationGlobalConfigProps`、`NotificationConfig`、
`NotificationInstance`、`NotificationPlacement`、`NotificationIconType`、`NotificationSemanticType`。

## Theme（Component Token）

7 个键（CSS 变量 `--apollo-notification-*`），其中 3 个有默认值：

| token | 值 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + CONTAINER_MAX_OFFSET(1000) + 50` = **2050**（⚠️ message 是 `+10`） |
| `width` | `384` |
| `progressBg` | `linear-gradient(90deg, colorPrimaryBorderHover, colorPrimary)` |
| `colorSuccessBg` / `colorErrorBg` / `colorInfoBg` / `colorWarningBg` | 默认 `undefined`（产物是带 fallback 的 `var()`） |

## 设计说明

### 与 message 共用通知内核

两者都建立在 `notification/engine/`（rc-notification 的 Vue 自建）之上；差异只在配置翻译
与 notice 内部的语义（notification 有标题 + 描述 + 操作区 + 关闭按钮，message 只有一行文本）。

### 默认就堆叠

`DEFAULT_STACK_CONFIG = { offset: 8 }` ⇒ 列表根恒带 `-stack` 类，超过阈值（默认 3）自动折叠。
`message` 的默认是 `false`（不堆叠）—— 这是两者最容易搞混的一处。

### 样式引入

```ts
import '@apollo-design/theme/dist/tokens.css';      // 主题变量，必须先引
import '@apollo-design/ui/notification/style.css';  // 按需
// 或
import '@apollo-design/ui/style.css';               // 汇总
```

## FAQ

**为什么关闭按钮有时没有图标？**

`closable: false` 或 `closeIcon: null` 会**整个移除按钮**（上游语义）；
要「有按钮但不渲染图标」请用 `closable: { closeIcon: null }`。

**`duration: 0` 和 `duration: false` 有区别吗？**

没有 —— 都会被归一化成 `false`（不自动关闭）。

**同 key 再 open 会怎样？**

复用同一条通知并更新内容（`update` demo），不会新增一条。

:::
