---
category: 数据录入
title: ColorPicker
subtitle: 颜色选择器
---

提供颜色选取的组件：点击触发器弹出取色面板，支持单色 / 渐变色、预设色板与多种编码格式。

## 何时使用

- 需要让用户选取一个颜色（或一段渐变色）时；
- 需要用预设色板让用户快速取色时；
- 需要在表单里以**受控**方式维护颜色值时。

## 代码演示

见 [`demo/`](./demo)（**16 个**，覆盖 antd 的主要用户场景）。

| demo | 内容 |
|---|---|
| `base` | 最简用法（`defaultValue` + 触发器） |
| `size` | 触发器 `small` / 默认 / `large` 三档（含 `showText`） |
| `controlled` | `value` + `@change` / `@changeComplete` 两种受控节奏 |
| `line-gradient` | `mode` 单色 / 渐变（可多选） |
| `text-render` | 默认文本与原生 #showText 作用域插槽 |
| `disabled` | 禁用态 |
| `disabled-alpha` | `disabledAlpha` 去掉透明度 |
| `allowClear` | 清空入口与「已清空」态 |
| `trigger` | 默认插槽自定义触发器 |
| `trigger-event` | `trigger="hover"` |
| `format` | `format` 的 `hex` / `hsb` / `rgb` |
| `presets` | 分组预设色 |
| `presets-line-gradient` | 渐变预设色 |
| `panel-render` | `panelRender` 自由接管面板 |
| `style-class` | `classNames` / `styles` 的对象 / 函数形态 |
| `pure-panel` | `ColorPickerPurePanel` 静态面板 |

⚠️ 上游的 `_semantic` demo（文档的「语义化 DOM」示意，`simplify` 专用）**不落地**；
语义槽的覆盖由 `semantic.test.ts` 承担。

## API

原生 `class`、`id`、ARIA 和鼠标监听器落在触发器；Vue 模板的 `@mousedown` 等已知原生事件及 Once/Passive/Capture 后缀保留。仅更新 attrs 时也会读取当前值，监听器替换不重复调用。

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
| showText | 显示默认文本；自定义内容用 #showText | `boolean` | `false` | × |
| size | 尺寸 | `'small' \| 'middle' \| 'large' \| string` | 跟随 ConfigProvider | ✅ |
| disabled | 禁用 | `boolean` | 跟随 ConfigProvider | ✅ |

| classNames | 语义化类名（`root` / `body` / `content` / `description` / `popup`），支持函数形态 | `ColorPickerSemanticClassNames \| ((info) => …)` | — | ✅ |
| styles | 语义化样式（6 个槽，比 `classNames` 多一个 `popupOverlayInner`），支持函数形态 | `ColorPickerSemanticStyles \| ((info) => …)` | — | ✅ |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-color-picker` | × |
| class / style | 原生 attrs 作用于实际触发器；浮层使用 popup.root | Vue class / StyleValue | — | × |

#### ColorValueType

```ts
type SingleValueType = AggregationColor | string;
type LineGradientType = { color: SingleValueType; percent: number }[];
type ColorValueType = SingleValueType | null | LineGradientType;
```

⚠️ **「清空」不是 `null`，而是 alpha=0 的颜色实例 + `cleared = true`**。触发器据此
在 `ColorClear`（透明棋盘格）与 `ColorBlock`（色块）之间切换。

Color 实例的数字输入表示 0x000000–0xffffff 的整数 RGB；对象通道支持有限数字与数字字符串，HSB 的 s/b 为 0–1。非法数字会抛出可定位的输入错误，不转成默认颜色。

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
| panelRender | 自定义面板；panel 是稳定的 Vue 组件引用 | `{ panel: Component; extra: ColorPickerPanelRenderExtra }` |
| showText | 自定义触发器文字，按当前插槽存在性渲染完整内容 | `{ color: Color }` |

`extra.components` 提供 `{ Picker, Presets }` 两个组件引用，供自定义面板自行编排：

```vue
<script setup lang="ts">
import { ColorPicker } from '@apollo-design/ui';
</script>

<template>
  <ColorPicker default-value="#1677ff">
    <template #panelRender="{ panel }">
      <section>
        <p>Color Picker</p>
        <component :is="panel" />
      </section>
    </template>
    <template #showText="{ color }">{{ color.toHexString() }}</template>
  </ColorPicker>
</template>
```

### Methods

本轮不新增命令或 Expose 接口。

### Design Token

**用户可覆盖的 Component Token：0 个**（与 antd 一致）。

九个样式派生值使用 --apollo-color-picker-* CSS 变量，不是 theme.components.ColorPicker 的配置字段。当前主题别名同步到触发器与弹层；需要自定义派生样式时，在对应宿主覆盖 CSS 变量：

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
| `root` | 原生触发按钮（自定义触发器时为所属宿主） |
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

disabledAlpha 下，新输入在 change / changeComplete 中归一为不透明；渐变逐段处理，不扁平化为单色。清空动作保留其独立语义。

### 开发版迁移

- 删除 panelRender 函数 prop，改用 #panelRender；作用域 panel 现在是稳定的 Vue 组件引用，可直接写 <component :is="panel" />。
- showText 只接受 boolean，函数内容改为 #showText，作用域提供当前 color。条件槽与空槽按存在性处理。
- 默认触发器、预设选择和面板清空使用原生 button；触发器内清空图形为不可聚焦装饰。原始参考保留，语义测试只派生这组已说明的差异。
- size 使用共享 SizeType，不接受任意字符串。原生 class/style 只作用于触发器；浮层用 classNames.popup.root/styles.popup.root，内部容器用 styles.popupOverlayInner。
- 受控开关/格式拒绝的请求不泄漏到撤控状态；disabledAlpha 归一新输入的每个渐变段，清空动作保持 cleared。
- PurePanel 在正常文档流展示真实面板；原生 attrs 落宿主，panelRender 槽与 Vue 事件真实转发，不再轮询尺寸。
