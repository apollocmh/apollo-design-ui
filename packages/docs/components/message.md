---
title: Message 全局提示
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

全局展示操作反馈信息。命令式 API（`message.success(...)`），浮层走 portal。

## 何时使用

- 需要在页面顶部短暂提示操作结果（成功 / 失败 / 警告 / 进行中）。
- 需要「进行中 → 完成」的连续反馈（`loading` + `then` 串联）。
- ⚠️ 优先用 `message.useMessage()` 的 `contextHolder`：静态方法**无法消费 context**，
  ConfigProvider 的配置对它不生效。

:::

## 代码演示

::: v-pre

**component-token**：组件级 token 调试（本仓以默认主题渲染 —— ConfigProvider 的组件级 token 覆盖尚未落地）。

:::

<DemoPreview component="message" demo="component-token" />

::: v-pre

**duration**：自定义时长 `10s`，默认时长为 `3s`。

:::

<DemoPreview component="message" demo="duration" />

::: v-pre

**hooks**：通过 `message.useMessage` 创建支持读取 context 的 `contextHolder`。请注意，我们推荐通过顶层注册的方式代替 `message` 静态方法，因为静态方法无法消费上下文，因而 ConfigProvider 的数据也不会生效。

:::

<DemoPreview component="message" demo="hooks" />

::: v-pre

**info**：静态方法无法消费 Context，不能动态响应 ConfigProvider 提供的各项配置。请优先使用 hooks 版本或者 App 组件提供的 `message` 实例。

:::

<DemoPreview component="message" demo="info" />

::: v-pre

**loading**：进行全局 loading，异步自行移除。

:::

<DemoPreview component="message" demo="loading" />

::: v-pre

**other**：包括成功、失败、警告。

:::

<DemoPreview component="message" demo="other" />

::: v-pre

**render-panel**：调试用组件，请勿直接使用。

:::

<DemoPreview component="message" demo="render-panel" />

::: v-pre

**stack**：堆叠配置，默认关闭。超过阈值后的消息会被自动收起，可以通过 `threshold` 设置触发堆叠的数量。折叠状态下仅展示最新的消息。

:::

<DemoPreview component="message" demo="stack" />

::: v-pre

**style-class**：通过 `classNames` 和 `styles` 可以自定义消息的语义化结构样式。

:::

<DemoPreview component="message" demo="style-class" />

::: v-pre

**thenable**：可以通过 then 接口在关闭后运行 callback。以上用例将在每个 message 将要结束时通过 then 显示新的 message。

:::

<DemoPreview component="message" demo="thenable" />

::: v-pre

**update**：可以通过唯一的 `key` 来更新内容。

:::

<DemoPreview component="message" demo="update" />

::: v-pre

## API

### 静态方法

| 方法 | 说明 | 签名 |
|---|---|---|
| `message.success` / `info` / `warning` / `error` / `loading` | 打开一条对应类型的消息 | `(content, duration?, onClose?) => MessageType` |
| `message.open` | 完整配置打开 | `(config: ArgsProps) => MessageType` |
| `message.destroy` | 关闭（传 key 关一条，不传清空） | `(key?: string \| number) => void` |
| `message.config` | 全局默认配置（**合并**语义） | `(config: ConfigOptions) => void` |
| `message.useMessage` | hooks 形态 | `(config?: ConfigOptions \| (() => ConfigOptions)) => [MessageInstance, () => VNode]` |
| `message._InternalPanelDoNotUseOrYouWillBeFired` | 私有：单条静态面板（文档/调试） | 组件 |
| `message._InternalListDoNotUseOrYouWillBeFired` | 私有：静态列表（同上） | 组件 |

> ⚠️ `success('内容', duration)` 的**第二参传函数**时它被当作 `onClose`，第三参忽略。

### 返回值 `MessageType`

**可调用 + thenable**（与 antd 同构）：

```ts
const hide = message.loading('进行中…', 0);
hide();                       // 调用即关闭
message.loading('进行中…', 2).then(() => message.success('完成'));
```

| 成员 | 说明 |
|---|---|
| `()` | 关闭这条消息 |
| `.then(fn)` | **自然关闭**（计时到点）后 resolve `true`；⚠️ 手动关闭不 resolve（上游语义） |
| `.promise` | 底层 `Promise<boolean>` |

### `ArgsProps`（`message.open` 的入参）

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| content | 内容 | `VNodeChild` | — |
| duration | 显示时长（秒）。`0` 不自动关闭 | `number` | `3` |
| type | `'info' \| 'success' \| 'error' \| 'warning' \| 'loading'` | — | — |
| key | 唯一标识；同 key 再 open ⇒ **复用同一条**（更新内容） | `string \| number` | 自动生成 |
| icon | 自定义图标（优先于类型图标；类型类名仍叠加） | `VNodeChild` | 类型图标 |
| onClose | 自然关闭时回调 | `() => void` | — |
| onClick | 点击 notice 根 | `(e: MouseEvent) => void` | — |
| pauseOnHover | 悬停暂停计时 | `boolean` | `true` |
| className / style | notice 根的类名/样式 | — | — |
| classNames / styles | 语义化槽位（见下） | — | — |

### `ConfigOptions`（`config()` / `useMessage()`）

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| top | 距顶部偏移（number ⇒ px） | `number \| string` | `8` |
| duration | 默认时长（秒） | `number` | `3` |
| maxCount | 最多同时显示（超出保留**最后** N 条） | `number` | — |
| rtl | 列表根加 `-rtl` 类 | `boolean` | 取 ConfigProvider 方向 |
| stack | 堆叠折叠：`true` 或 `{ threshold }` | `boolean \| { threshold?: number }` | `false` |
| pauseOnHover | 悬停暂停 | `boolean` | `true` |
| getContainer | portal 容器 | `() => HTMLElement` | `document.body` |
| prefixCls | 类名前缀 | `string` | `apollo-message` |
| transitionName | 动效名 | `string` | `{prefixCls}-fade` |
| classNames / styles | 语义化槽位 | — | — |

### 语义化槽位（6 个）

```
list / listContent        // 列表级
root / wrapper / icon / title   // 单条级
```

> ⚠️ 本仓只支持**对象形态**（函数式语义槽 PENDING，D36 同判）。

### Slots（C8-R2，仅 `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板）

| Slot | 说明 | 参数 |
|---|---|---|
| content | 富内容（文本 `content` prop 等价，slot 优先） | — |
| icon | 自定义图标（空 slot 等价隐藏） | — |

> `message.open({ content, icon })` 的命令式入参保持 `VNodeChild`（程序化上下文，无模板）。

### 类型导出

`MessageArgsProps`、`MessageConfigOptions`、`MessageInstance`、`MessageType`、
`MessageNoticeType`、`MessageTypeOpen`、`MessageJointContent`、`MessageSemanticType`。

## Theme（Component Token）

3 个（CSS 变量 `--apollo-message-*`）：`zIndexPopup`(`zIndexPopupBase + 1000 + 10` = **2010**，
注意不是 notification 的 `+50`) / `contentBg`(`colorBgElevated`) /
`contentPadding`(`(controlHeightLG − fontSize × lineHeight) / 2` px + `paddingSM` px)。

## 设计说明

### 复用了 notification 的共享样式层

antd 的 message 完全建立在 rc-notification 之上（`useRcNotification`），样式也复用
notification 的共享 token 与列表项样式。本仓同样如此：命令式 API 与浮层结构由
`notification/engine/`（rc-notification 的 Vue 自建）提供，message 只做
「配置翻译 + 图标/语义槽 + 命令式入口」。

### 命令式路径的 holder 与队列

`message.success()` 没有组件实例 ⇒ 状态挂在**模块级单例**上：首次调用建 holder
（挂到**游离 div** 上，不进 document）、把任务压进队列，实例就绪后按序回放。
`config()` 是**合并**语义并触发一次同步。

### 样式引入

```ts
import '@apollo-design/theme/dist/tokens.css'; // 主题变量，必须先引
import '@apollo-design/ui/message/style.css';  // 按需
// 或
import '@apollo-design/ui/style.css';          // 汇总
```

自定义 `prefixCls`（如 `my-app`）时用 `genMessageStyle('my-app')` 自行产出 CSS。

## FAQ

**为什么 notice 里没有关闭按钮？**

message 传的是 `closable: false`（与 antd 一致）—— 消息靠计时自动消失，
不需要关闭按钮。

**`config()` 之后已经显示的消息会跟着变吗？**

`top` / `rtl` / `prefixCls` 这类**列表级**配置会影响后续渲染；`maxCount` 只影响下一次 open。
已经显示出来的单条不会重排（与 antd 同）。

:::
