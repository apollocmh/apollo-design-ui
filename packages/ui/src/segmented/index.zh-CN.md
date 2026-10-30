---
category: 数据录入
title: Segmented
subtitle: 分段控制器
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
| size | 控件尺寸 | `'small' \| 'middle' \| 'medium' \| 'large'` | 'middle' | |
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
| change | 请求选中值变化 | `(value: SegmentedValue) => void` |
| keydown | 原生键盘事件；先于内部导航，可调用 `preventDefault()` | `(event: KeyboardEvent) => void` |

`change` 与 `update:value` 是 Vue 所属事件；模板使用 `@change` / `v-model:value`，`h()` 使用 `onChange` / `onUpdate:value`，不再手动调用 attrs 中的监听器。

受控时仅提议更新，父级拒绝后恢复原生 radio 的实际勾选；撤控保留最后接受的值。`defaultValue` 只初始化一次，未提供时在首批选项到达后取第一项。后续重排或删除不静默改变选择；受控值不在选项中时保持该值且无项目勾选。

原生 `class`、完整 `style`（对象、字符串、数组）、id、ARIA/data 与监听器落到实际根 div，native style 的优先级高于语义根样式。根本身不增加默认 Tab 停靠点，当前可用 radio（未命中时为首个可用项）是唯一 Tab 入口。方向键跳过禁用项并环绕；水平 RTL 反转左右方向，原生取消和输入法期间不导航。只有父级接受更新才移动键盘焦点。

`ConfigProvider` 的当前禁用、尺寸、方向及 `components.segmented` 语义配置响应更新与撤回，组件 `disabled=false` 可显式覆盖全局禁用。

### SegmentedValue

```ts
type SegmentedValue = string | number;
```

### SegmentedOptions

```ts
type SegmentedOption = SegmentedValue | SegmentedLabeledOption;
type SegmentedOptions = readonly SegmentedOption[];

interface SegmentedLabeledOptionWithoutIcon {
  value: SegmentedValue;
  label: VNodeChild; // 完整 Vue 内容，包括数组和 Fragment
  disabled?: boolean;
  title?: string;
  className?: string;
  id?: string;
  tooltip?: string | TooltipProps;
}

interface SegmentedLabeledOptionWithIcon {
  value: SegmentedValue;
  icon: VNodeChild;
  label?: VNodeChild;
  disabled?: boolean;
  title?: string;
  tooltip?: string | TooltipProps;
}
```

内容通过选项数据提供，`label` / `icon` 接受完整 `VNodeChild`（含 0、数组和 Fragment），不接受未消费的渲染回调。`id` 落到对应 label；原生 radio 的 `value` 是选项值的字符串形式，事件保留原始 string/number 类型。图标选项无文本时以 `title` 或选项值提供原生访问名称，建议填写有意义的 title。

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

`trackPadding` 支持数字（px）或 CSS 长度字符串；其余七项接受 CSS 字符串。通过 `theme.components.Segmented` 覆盖的八项均在实际根生效，并响应替换与移除。
