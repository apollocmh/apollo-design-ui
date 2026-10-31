---
category: 其他
title: App
subtitle: 包裹组件
---

为子树提供独立的 Message、Notification 和 Modal 服务，并为页面提供统一根样式。

## 代码演示

见 [`demo/`](./demo)：获取三个服务，以及替换当前消息和通知默认配置。

## API

| Prop | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 当前宿主的类名前缀 | `string` | `apollo-app` |
| component | 原生宿主；`false` 时只渲染内容及服务 holder | `'div' \| 'section' \| 'main' \| 'span' \| false` | `'div'` |
| message | Message hook 配置，沿嵌套 App 合并 | `MessageConfigOptions` | — |
| notification | Notification hook 配置，沿嵌套 App 合并 | `NotificationConfig` | — |

默认槽接受完整 Vue 内容，保留 `0`、数组、条件内容和显式空内容。App 没有所属事件、v-model 或命令式组件 ref 方法。根 `class`、`style`、原生属性及事件监听器作用于实际宿主；Provider 的 `components.app.className/style` 先合并，局部原生样式优先。

`component=false` 没有 attrs 落点，开发期会对已传入的原生 attrs 给出诊断，不将它们挪到子节点或浮层。改变宿主遵循 Vue 的原生子树替换规则；三个服务的 holder 是宿主的稳定同级节点，不随宿主替换。

### useApp

在 App **后代组件的 setup** 中调用具名 `useApp()` 或 `App.useApp()`：

```ts
const { message, notification, modal } = App.useApp();
const close = message.loading('处理中', 0);
close.then((terminated) => console.log(terminated));
const confirm = modal.confirm({ title: '确认操作？' });
confirm.then((accepted) => console.log(accepted));
```

返回对象的实际类型为 `UseAppProps`：`message: MessageInstance`、`notification: NotificationInstance`、`modal: ModalHookAPI`。服务方法与各自 hook 相同，支持其真实返回值和业务回调。后代 setup 中的提前调用由各自 holder 队列接收。每个 App 拥有独立实例，嵌套 App 使用最近的 provider；App 卸载时终止其工作并释放浮层及资源。

没有 App provider 或 Vue 注入上下文时，`useApp()` 明确抛出 `[Apollo App] useApp() requires an App provider.`，不再返回假空 API。调用位置应在后代 setup，不能在创建 App 的父组件 setup 中读取尚不存在的子级 provider。

### 配置、主题与迁移

`message`、`notification` 分别按字段浅合并父 App 和本地对象，本地字段优先。替换配置会移除旧对象独有字段；撤除本地 prop 会恢复父 App 的当前配置。注入对象引用保持稳定，后代和 holder 都读取当前配置。已有消息的具体更新职责以相应服务 API 为准。

App 没有自有 Component Token，样式消费全局 `colorText`、`fontSize`、`lineHeight`、`fontFamily` 变量；当前 Provider 的方向、前缀及样式替换和撤除都会反映到宿主。

旧文档中的 `className/rootClassName` 改用原生 `class`；`style` 使用原生 StyleValue。AppConfig 和 useApp 不再使用任意字段或占位方法类型。导出 `AppProps`、`AppComponentType`、`AppConfig`、`AppSlots`、`UseAppProps`。
