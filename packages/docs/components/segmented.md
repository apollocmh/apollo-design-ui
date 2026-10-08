---
title: Segmented 分段控制器
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

# Segmented 分段控制器

用于展示多个选项并允许用户选择其中单个选项。

## 引入

```ts
import { Segmented } from '@apollo-design/ui';
```

:::

## 代码演示

::: v-pre

**basic**：最简单的用法。

:::

<DemoPreview component="segmented" demo="basic" />

::: v-pre

**block**：`block` 属性使其适配父元素宽度。

:::

<DemoPreview component="segmented" demo="block" />

::: v-pre

**component-token**：通过 ConfigProvider 的 `theme.components.Segmented` 覆盖。

:::

<DemoPreview component="segmented" demo="component-token" />

::: v-pre

**controlled**：通过 `v-model:value` 受控。

:::

<DemoPreview component="segmented" demo="controlled" />

::: v-pre

**custom**：自定义渲染选项内容，并支持为选项配置 tooltip 提示（`tooltip` 支持 `string | TooltipProps`）。

:::

<DemoPreview component="segmented" demo="custom" />

::: v-pre

**disabled**：`disabled` 支持「整组禁用」与「单项禁用」两种粒度。

:::

<DemoPreview component="segmented" demo="disabled" />

::: v-pre

**dynamic**：options 动态变化时选中值与 thumb 自动跟随。

:::

<DemoPreview component="segmented" demo="dynamic" />

::: v-pre

**icon-only**：只给 `icon` 不给 `label` 的选项。

:::

<DemoPreview component="segmented" demo="icon-only" />

::: v-pre

**shape**：`shape="round"` 时根与选项全圆角。

:::

<DemoPreview component="segmented" demo="shape" />

::: v-pre

**size**：`small` / `middle`（默认）/ `large`。

:::

<DemoPreview component="segmented" demo="size" />

::: v-pre

**style-class**：`classNames` / `styles` 支持对象与函数式。

:::

<DemoPreview component="segmented" demo="style-class" />

::: v-pre

**vertical**：`vertical` 时 thumb 沿纵轴移动。

:::

<DemoPreview component="segmented" demo="vertical" />

::: v-pre

**with-icon**：`icon` 与 `label` 同时使用；第三方库的裸 `<svg>` 也能对齐（样式层 `-item-icon > svg`）。

:::

<DemoPreview component="segmented" demo="with-icon" />

::: v-pre

**with-name**：内部 radio input 的 `name`；未传时自动生成。

:::

<DemoPreview component="segmented" demo="with-name" />

::: v-pre

## API

通用属性参考：通用属性。

### SegmentedProps

| 参数 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| block | 值块占满整行 | boolean | false | |
| disabled | 是否禁用 | boolean | false | |
| options | 数据化配置选项 | `SegmentedOptions` | [] | |
| shape | 形状 | `'default' \| 'round'` | 'default' | |
| size | 控件尺寸 | `'small' \| 'middle' \| 'large'` | 'middle' | |
| value | 当前值（受控） | SegmentedValue | - | |
| defaultValue | 初始值；未传时选中第一个选项 | SegmentedValue | - | |
| name | 内部 radio input 的 `name` | string | 自动生成 | |
| vertical | 纵向布局（旧 API） | boolean | false | |
| orientation | 布局方向（新 API） | `'horizontal' \| 'vertical'` | - | |
| prefixCls | 类名前缀 | string | - | |
| classNames | 语义化类名（支持函数式） | `{ root, icon, label, item }` | - | |
| styles | 语义化样式（支持函数式） | `{ root, icon, label, item }` | - | |

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:value | 选中值变化（配合 `v-model:value`） | `(value: SegmentedValue) => void` |
| onChange | 选中值变化 | `(value: SegmentedValue) => void` |

> `onChange` 与 antd 一致作为 props 回调传入（`on-change` / `:onChange`），不经过 emits 声明。

### SegmentedValue

```ts
type SegmentedValue = string | number;
```

### SegmentedOptions

```ts
type SegmentedOption = SegmentedValue | SegmentedLabeledOption;
type SegmentedOptions = SegmentedOption[];

interface SegmentedLabeledOptionWithoutIcon {
  value: SegmentedValue;
  label: unknown; // string | VNode
  disabled?: boolean;
  title?: string;
  className?: string;
  id?: string;
  tooltip?: string | Omit<TooltipProps, 'children'>;
}

interface SegmentedLabeledOptionWithIcon {
  value: SegmentedValue;
  icon: VNode;
  label?: unknown;
  disabled?: boolean;
  title?: string;
  tooltip?: string | Omit<TooltipProps, 'children'>;
}
```

### Ref

```ts
interface SegmentedRef {
  nativeElement: HTMLDivElement | null;
}
```

## 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| itemColor | 选项文本颜色 | colorTextLabel |
| itemHoverColor | 选项悬浮态文本颜色 | colorText |
| itemHoverBg | 选项悬浮态背景色 | colorFillSecondary |
| itemActiveBg | 选项激活态背景色 | colorFill |
| itemSelectedBg | 选项选中背景色 | colorBgElevated |
| itemSelectedColor | 选项选中文字色 | colorText |
| trackPadding | 控件容器 padding | lineWidthBold |
| trackBg | 控件容器背景色 | colorBgLayout |

:::
