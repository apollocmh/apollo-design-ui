---
category: Other
title: App
subtitle: App
---

新的包裹组件，提供重置样式与消费 context 的 hook。

## When To Use

- Provide context instances for `message`, `notification`, `modal`. 
- Provide unified root styles for the application.

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| component | 渲染的根元素；`false` ⇒ 无包裹 | `'div' \| 'section' \| 'main' \| 'span' \| false` | `'div'` |
| message | message 的配置（沿树合并） | `object` | — |
| notification | notification 的配置（沿树合并） | `object` | — |
| className / rootClassName / style | 根元素样式（antd 的 className 为 deprecated，用 rootClassName） | — | — |

### App.useApp()

```ts
const { message, notification, modal } = App.useApp();
```

`message` / `notification` / `modal` 由 `useMessage()` / `useNotification()` /
`Modal.useModal()` 提供（PENDING-2 已关闭，见 README §3）：每个 `App` 实例自带一套
通知容器，卸载 App 即销毁。

## 设计说明

- **消环**：context 抽到 `_internal/app-context.ts`（只含类型与 InjectionKey），
  避免 App ↔ 三个反馈组件的循环依赖。
- **配置合并**：嵌套 App 时 `AppConfig` 沿树浅合并（子覆盖父）。
