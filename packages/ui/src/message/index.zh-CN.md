---
category: 反馈
title: Message
subtitle: 全局提示
---

全局展示操作反馈信息。命令式 API（`message.success(...)`），浮层走 portal。

## 何时使用

- 需要在页面顶部短暂提示操作结果（成功 / 失败 / 警告 / 进行中）。
- 需要「进行中 → 完成」的连续反馈（`loading` + `then` 串联）。
- ⚠️ 优先用 `message.useMessage()` 的 `contextHolder`：静态方法**无法消费 context**，
  组件内 Provider 的配置不会注入静态实例；静态实例读取 `ConfigProvider.config()` 的全局服务。

## 代码演示

见 [`demo/`](./demo)（11 个，覆盖 antd 的主要用户场景）：component-token / duration / hooks /
info / loading / other / render-panel / stack / style-class / thenable / update。

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

**可调用 + thenable**：

```ts
const hide = message.loading('进行中…', 0);
hide();                       // 调用即关闭
message.loading('进行中…', 2).then(() => message.success('完成'));
```

| 成员 | 说明 |
|---|---|
| `()` | 关闭这条消息 |
| `.then(fn)` | 消息终止后 resolve `true`：计时关闭、调用句柄、destroy、淘汰、挂载前取消或 owner 卸载 |
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
| getContainer | portal 容器 | `() => HTMLElement \| ShadowRoot` | `document.body` |
| prefixCls | 类名前缀 | `string` | `apollo-message` |
| transitionName | 动效名 | `string` | `{prefixCls}-fade` |
| classNames / styles | 语义化槽位 | — | — |

### 语义化槽位（6 个）

```
list / listContent        // 列表级
root / wrapper / icon / title   // 单条级
```

> ⚠️ `classNames` / `styles` 使用对象。`list` / `listContent` 只属于 holder 配置和 PureList；单条 Args 与 PurePanel 只接受单条字段。

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

当前列表展示跟随配置更新，`maxCount` 在下一次 `open` 时执行。


Hook holder 内已打开消息的类型与图标类跟随当前 ConfigProvider 前缀，保留 keyed 正文及用户样式。显式 icon（含 null、false、0）优先于类型默认图标。手动 destroy 不触发 onClose，自然关闭保留既有回调契约。


### Vue 契约与迁移

在 setup 中调用 `useMessage`，将零参 holder factory 作为组件渲染，或调用它取得 VNode。holder 挂载前的命令按序排队。同 key 的每个返回句柄都会在终止时结算；`true` 表示终止，不表示成功展示。最新 `onClose` 仍只在自动关闭时调用，调用关闭句柄、destroy、淘汰或卸载不会额外触发它。

PurePanel 将原生 `class`、`style`、attrs 和类型化 `@click` 作用到实际宿主；旧 `className` 改用 `class`。富内容使用 `#content` / `#icon`，保留 `0` 与显式空内容。PureList 的语义样式映射改用 `styles`，原生 `style` 设置其宿主样式。

Holder 配置和 Provider 对象在渲染时读取，替换和撤除会更新已有 keyed 内容且保留用户输入节点。三个组件 Token 跟随当前主题。列表数值 z-index 覆盖（含 `0` 和数值字符串）同时提供后代 popup 使用的数值上下文；CSS 表达式保持原样，数值上下文使用当前 Token。
