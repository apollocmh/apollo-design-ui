---
title: App 包裹组件
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

新的包裹组件，提供重置样式与消费 context 的 hook。

## 何时使用

- 需要提供 `message`、`notification`、`modal` 的 context 实例（避免静态方法
  的上下文丢失）。
- 需要为应用提供统一的根样式（color / fontSize / lineHeight / fontFamily）。

:::

## 代码演示

::: v-pre

**basic**：获取 `message`、`notification`、`modal` 实例。

:::

<DemoPreview component="app" demo="basic" />

::: v-pre

**config**：对 `message`、`notification` 进行配置。

:::

<DemoPreview component="app" demo="config" />

::: v-pre

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

:::
