---
category: 数据录入
title: Segmented 分段控制器
titleTemplate: '%s - @apollo-design/ui'
description: 用于展示多个选项并允许用户选择其中单个选项。
---

# Segmented 分段控制器

用于展示多个选项并允许用户选择其中单个选项。

## 引入

```ts
import { Segmented } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 受控模式

<code src="./demo/controlled.vue"></code>

### 占满整行

<code src="./demo/block.vue"></code>

### 禁用

<code src="./demo/disabled.vue"></code>

### 动态选项

<code src="./demo/dynamic.vue"></code>

### 纯图标

<code src="./demo/icon-only.vue"></code>

### 带图标

<code src="./demo/with-icon.vue"></code>

### 自定义渲染 + tooltip

<code src="./demo/custom.vue"></code>

### 圆形

<code src="./demo/shape.vue"></code>

### 三种大小

<code src="./demo/size.vue"></code>

### 纵向布局

<code src="./demo/vertical.vue"></code>

### 指定 name

<code src="./demo/with-name.vue"></code>

### 语义化 styles

<code src="./demo/style-class.vue"></code>

### 组件级 Token

<code src="./demo/component-token.vue"></code>

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
