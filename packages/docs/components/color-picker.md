---
title: ColorPicker 颜色选择器
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

提供颜色选取的组件：点击触发器弹出取色面板，支持单色 / 渐变色、预设色板与多种编码格式。

## 何时使用

- 需要让用户选取一个颜色（或一段渐变色）时；
- 需要用预设色板让用户快速取色时；
- 需要在表单里以**受控**方式维护颜色值时。

:::

## 代码演示

::: v-pre

**allowClear**：`allowClear` 在面板操作条与触发器上给出清空入口；清空后触发器渲染成透明棋盘格。

:::

<DemoPreview component="color-picker" demo="allowClear" />

::: v-pre

**base**：最简单的用法：给一个 `defaultValue`，点击触发器即可取色。

:::

<DemoPreview component="color-picker" demo="base" />

::: v-pre

**controlled**：`value` + `@change` 让组件受控；换成 `@changeComplete` 则**拖拽结束**才同步，展示色会被「锁住」。

:::

<DemoPreview component="color-picker" demo="controlled" />

::: v-pre

**disabled-alpha**：`disabledAlpha` 去掉 alpha 滑块与 alpha 输入，并把半透明色强制为不透明。

:::

<DemoPreview component="color-picker" demo="disabled-alpha" />

::: v-pre

**disabled**：`disabled` 禁用整个组件；触发器仍会渲染当前颜色。

:::

<DemoPreview component="color-picker" demo="disabled" />

::: v-pre

**format**：`format` 控制输入区与文本的编码格式，支持 `hex` / `hsb` / `rgb`。

:::

<DemoPreview component="color-picker" demo="format" />

::: v-pre

**line-gradient**：`mode` 决定面板支持单色还是渐变色（可多选）；渐变值形如 `[{ color, percent }]`。

:::

<DemoPreview component="color-picker" demo="line-gradient" />

::: v-pre

**panel-render**：`panelRender` 是函数 prop，可完全接管面板内容（例如加标题、改成左右分栏）。

:::

<DemoPreview component="color-picker" demo="panel-render" />

::: v-pre

**presets-line-gradient**：`presets` 的每一项颜色也可以是**渐变**（`mode` 需包含 `gradient`）。

:::

<DemoPreview component="color-picker" demo="presets-line-gradient" />

::: v-pre

**presets**：`presets` 传入分组预设色，面板底部会出现对应色块列表。

:::

<DemoPreview component="color-picker" demo="presets" />

::: v-pre

**pure-panel**：`ColorPickerPurePanel` 把面板**静态**渲染进文档流（不弹浮层），供文档 / 预览使用。

:::

<DemoPreview component="color-picker" demo="pure-panel" />

::: v-pre

**size**：触发器有 `small` / 默认 / `large` 三档尺寸，可配合 `showText` 一起用。

:::

<DemoPreview component="color-picker" demo="size" />

::: v-pre

**style-class**：`classNames` / `styles` 可传对象或函数，用来定制 5 个语义槽的类名与样式。

:::

<DemoPreview component="color-picker" demo="style-class" />

::: v-pre

**text-render**：`showText` 打开触发器右侧文本；传函数可自定义文本（例如一个随开合翻转的箭头）。

:::

<DemoPreview component="color-picker" demo="text-render" />

::: v-pre

**trigger-event**：`trigger` 只有两档：`click`（默认）与 `hover`。

:::

<DemoPreview component="color-picker" demo="trigger-event" />

::: v-pre

**trigger**：`children`（默认插槽）可完全替换内置触发器。

:::

<DemoPreview component="color-picker" demo="trigger" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| mode | 模式：单色 / 渐变（可多选） | `'single' \| 'gradient' \| ModeType[]` | `'single'` | × |
| value | 受控值（配合 `v-model:value`） | `ColorValueType` | — | × |
| defaultValue | 非受控初值。**都不传 ⇒ 「已清空」态** | `ColorValueType` | — | × |
| format | 当前编码格式（配合 `v-model:format`） | `'hex' \| 'rgb' \| 'hsb'` | `'hex'` | × |
| defaultFormat | 非受控初始格式 | `'hex' \| 'rgb' \| 'hsb'` | — | × |
| disabledFormat | 是否禁用格式下拉（下拉没了，输入框仍在） | `boolean` | `false` | × |
| open | 受控开合（配合 `v-model:open`） | `boolean` | — | × |
| trigger | 触发方式 | `'click' \| 'hover'` | `'click'` | × |
| placement | 浮层位置 | `TriggerPlacement` | `'bottomLeft'` | × |
| arrow | 是否显示箭头 | `boolean \| { pointAtCenter?: boolean }` | 跟随 ConfigProvider | ✅ |
| getPopupContainer | 浮层挂载容器 | `(triggerNode: HTMLElement) => HTMLElement` | — | × |
| autoAdjustOverflow | 溢出自动调整 | `boolean` | `true` | × |
| destroyTooltipOnHide | ⚠️ **已废弃**，请用 `destroyOnHidden` | `boolean \| { keepParent?: boolean }` | `false` | × |
| destroyOnHidden | 关闭后卸载浮层 | `boolean` | `false` | × |
| allowClear | 是否允许清空 | `boolean` | `false` | × |
| disabledAlpha | 禁用 alpha（面板不渲染 alpha 滑块与输入；半透明色会被强制为不透明） | `boolean` | `false` | × |
| presets | 预设面板（**数组**才渲染，且会多一条 `Divider`） | `PresetsItem[]` | — | × |
| showText | 触发器右侧文本；`true` 走 locale，函数则自定义 | `boolean \| ((color: Color) => VNodeChild)` | `false` | × |
| size | 尺寸 | `'small' \| 'middle' \| 'large' \| string` | 跟随 ConfigProvider | ✅ |
| disabled | 禁用 | `boolean` | 跟随 ConfigProvider | ✅ |
| panelRender | 自定义面板。**函数 prop**（返回 VNode），另有同名 scoped slot | `(panel, extra) => VNodeChild` | — | × |
| classNames | 语义化类名（`root` / `body` / `content` / `description` / `popup`），支持函数形态 | `ColorPickerSemanticClassNames \| ((info) => …)` | — | ✅ |
| styles | 语义化样式（6 个槽，比 `classNames` 多一个 `popupOverlayInner`），支持函数形态 | `ColorPickerSemanticStyles \| ((info) => …)` | — | ✅ |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-color-picker` | × |
| class / style | **根节点原生 attrs**（替代上游 `className` / `rootClassName` / `style`；`class` 同时进触发器与浮层根） | `string \| array \| object` / `CSSProperties` | — | × |

#### ColorValueType

```ts
type SingleValueType = AggregationColor | string;
type LineGradientType = { color: SingleValueType; percent: number }[];
type ColorValueType = SingleValueType | null | LineGradientType;
```

⚠️ **「清空」不是 `null`，而是 alpha=0 的颜色实例 + `cleared = true`**。触发器据此
在 `ColorClear`（透明棋盘格）与 `ColorBlock`（色块）之间切换。

#### PresetsItem

| 字段 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| label | 分组标题 | `VNodeChild` | — |
| colors | 该组颜色（字符串 / 颜色实例 / **渐变**） | `(string \| AggregationColor \| LineGradientType)[]` | — |
| defaultOpen | 初始是否展开 | `boolean` | `true` |
| key | 分组 key（不传用下标） | `string \| number` | — |

### Events

| 事件 | 说明 | 参数 |
|---|---|---|
| update:value | `v-model:value` 的更新通道（与 `change` **双发**） | `(value: Color)` |
| change | 值变化。⚠️ 第二个参数是 `toCssString()` 的 CSS 串 | `(value: Color, css: string)` |
| changeComplete | 值变化**完成**。⚠️ **拖拽期间不发** | `(value: Color)` |
| clear | 清空 | — |
| update:open | `v-model:open` 的更新通道（与 `openChange` **双发**） | `(open: boolean)` |
| openChange | 开合变化 | `(open: boolean)` |
| update:format | `v-model:format` 的更新通道（与 `formatChange` **双发**） | `(format?: ColorFormatType)` |
| formatChange | 格式变化。⚠️ **同值不发** | `(format?: ColorFormatType)` |

### Slots

| 插槽 | 说明 | 参数 |
|---|---|---|
| default | 触发器内容（等价上游 `children`）。传了就**完全不要**内置触发器 | — |
| panelRender | `panelRender` 的插槽形态（与函数 prop 二选一，slot 优先） | `{ panel: VNodeChild; extra: ColorPickerPanelRenderExtra }` |

`extra.components` 提供 `{ Picker, Presets }` 两个组件引用，供自定义面板自行编排：

```vue
<script setup lang="ts">
import type { ColorPickerPanelRenderExtra } from '@apollo-design/ui';
import { ColorPicker } from '@apollo-design/ui';
import { h, type VNodeChild } from 'vue';

const panelRender = (
  _panel: VNodeChild,
  { components: { Picker, Presets } }: ColorPickerPanelRenderExtra,
) => h('div', { style: { display: 'flex' } }, [h(Presets), h(Picker)]);
</script>

<template>
  <ColorPicker :panel-render="panelRender" />
</template>
```

### Methods

无。⚠️ 上游 `ColorPicker` **不转发 ref**（`ColorPicker.d.ts` 是裸 `React.FC`），
本仓同样**不 expose** —— 需要 DOM 时直接读组件根元素。

### Design Token

**用户可覆盖的 Component Token：0 个**（与 antd 一致）。

本仓把上游 9 个 `mergeToken` 派生值声明成 `--apollo-color-picker-*`（**用户不可覆盖**，
有意差异，见 `README.md` §2 / §4）：

| 变量 | 值 |
|---|---|
| `--apollo-color-picker-width` | `234px` |
| `--apollo-color-picker-handler-size` | `16px` |
| `--apollo-color-picker-handler-size-sm` | `12px` |
| `--apollo-color-picker-alpha-input-width` | `44px` |
| `--apollo-color-picker-input-number-handle-width` | `16px` |
| `--apollo-color-picker-preset-color-size` | `24px` |
| `--apollo-color-picker-inset-shadow` | `inset 0 0 1px 0 var(--apollo-color-text-quaternary)` |
| `--apollo-color-picker-slider-height` | `8px` |
| `--apollo-color-picker-preview-size` | `calc(var(--apollo-color-picker-slider-height) * 2 + var(--apollo-margin-sm))` |

### 语义化 DOM

| 槽 | 落在哪 |
|---|---|
| `root` | 触发器 `<div>` |
| `body` | 触发器里的色块 / 透明棋盘格 |
| `content` | 色块**内层**（`ColorBlock` 的 inner） |
| `description` | 触发器右侧文本容器 |
| `popup.root` | 浮层根节点（**嵌套槽**） |
| `popupOverlayInner` | ⚠️ **只有 `styles` 有**，映射到 Popover 的 `styles.container` |

⚠️ `classNames` 5 个槽、`styles` 6 个槽，**故意不对称**（与上游一致）。

## FAQ

### 为什么 `defaultValue` 不传时触发器是透明棋盘格？

因为上游的默认值就是「已清空」—— `useModeColor` 拿到 `undefined` ⇒
`AggregationColor` 走 `cleared` 分支（alpha=0）。想看到颜色请显式给 `defaultValue`。

### `disabledAlpha` 为什么把半透明色改写了？

上游行为：`disabledAlpha` 下，若当前色 `alpha < 100`，`change` / `changeComplete`
拿到的值会被 `genAlphaColor` 改写成不透明（并在开发期告警）。

### `panelRender` 用 prop 还是插槽？

两者等价，插槽优先。函数 prop 适合在 `<script setup>` 里用 `h()` 组织（本仓模板没有
「渲染一个 VNode 变量」的语法）；插槽适合简单包装。

:::
