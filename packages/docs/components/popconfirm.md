---
title: Popconfirm 气泡确认框
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

# Popconfirm 气泡确认框

目标元素的操作需要用户进一步的确认时使用。与 `Popover` 相比它内置了「确认 / 取消」两个按钮。

## 引入

```ts
import { Popconfirm } from '@apollo-design/ui';
```

:::

## 代码演示

::: v-pre

**async**：通过 `v-model:open` 受控，配合 `okButtonProps.loading` 表达进行中的状态。

:::

<DemoPreview component="popconfirm" demo="async" />

::: v-pre

**basic**：最简单的用法：`title` + `description` 双通道。

:::

<DemoPreview component="popconfirm" demo="basic" />

::: v-pre

**dynamic-trigger**：`onOpenChange` 里可以决定是否真的开合。

:::

<DemoPreview component="popconfirm" demo="dynamic-trigger" />

::: v-pre

**icon**：`icon` 可传任意渲染内容；传 `false` 则不渲染图标。

:::

<DemoPreview component="popconfirm" demo="icon" />

::: v-pre

**locale**：`okText` / `cancelText` 为空时回退到 locale 的 OK / Cancel。

:::

<DemoPreview component="popconfirm" demo="locale" />

::: v-pre

**placement**：支持 12 个方位。

:::

<DemoPreview component="popconfirm" demo="placement" />

::: v-pre

**promise**：`onConfirm` 返回 Promise 时按钮进 loading，resolve 后才关闭。

:::

<DemoPreview component="popconfirm" demo="promise" />

::: v-pre

**render-panel**：`PopconfirmPurePanel`（= `Popconfirm._InternalPanelDoNotUseOrYouWillBeFired`）只渲染浮层内容本身。

:::

<DemoPreview component="popconfirm" demo="render-panel" />

::: v-pre

**shift**：浮层在大页面里会自动调整位置（autoAdjustOverflow）。

:::

<DemoPreview component="popconfirm" demo="shift" />

::: v-pre

**style-class**：语义槽：`root` / `container` / `arrow` / `icon` / `title` / `content`（description 用 `content`）。

:::

<DemoPreview component="popconfirm" demo="style-class" />

::: v-pre

## API

### PopconfirmProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 标题（`0` 合法；可为惰性函数） | ReactNode / () => ReactNode | - |
| description | 描述文案（可为惰性函数） | ReactNode / () => ReactNode | - |
| disabled | 是否禁用（禁用后不展开，也不发 `onOpenChange`） | boolean | false |
| open | 是否展开（受控） | boolean | - |
| defaultOpen | 默认是否展开 | boolean | false |
| trigger | 触发行为 | string \| string[] | 'click' |
| placement | 浮层位置 | TooltipPlacement | 'top' |
| okText | 确认按钮文案；为空回退 locale | string | OK |
| okType | 确认按钮类型 | LegacyButtonType | 'primary' |
| cancelText | 取消按钮文案；为空回退 locale | string | Cancel |
| okButtonProps | 确认按钮属性；根类名使用 Vue 原生 `class` | PopconfirmButtonProps | - |
| cancelButtonProps | 取消按钮属性；根类名使用 Vue 原生 `class` | PopconfirmButtonProps | - |
| showCancel | 是否显示取消按钮 | boolean | true |
| icon | 自定义图标；`false` 时不显示 | VNode \| false | ExclamationCircleFilled |
| onOpenChange | 展开状态变化 | (open: boolean) => void | - |
| onConfirm | 点击确认 | (e?: MouseEvent) => void \| Promise | - |
| onCancel | 点击取消 | (e?: MouseEvent) => void | - |
| onPopupClick | 点击浮层内容 | (e: MouseEvent) => void | - |
| classNames | 语义化类名（root / container / arrow / icon / title / content） | 对象或函数 | - |
| styles | 语义化样式（同上） | 对象或函数 | - |

> 回调类（`onConfirm` / `onCancel` / `onOpenChange` / `onPopupClick`）作为 props 传入（`on-confirm` / `:onConfirm`），不经过 emits 声明。

### Ref

`Popconfirm` 与 `Popover` 同物：`forceAlign` / `nativeElement` / `popupElement`。

### 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| zIndexPopup | 浮层 z-index | zIndexPopupBase + 60 |

:::
